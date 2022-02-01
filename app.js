const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Article = require("./models/blog");
const Comment = require("./models/comment");
// const res = require("express/lib/response");
const authMiddleware = require("./middlewares/auth-middleware");
const Joi = require('joi');
const port = 8080;

// mongoose.connect("mongodb://localhost/nodejsblog_database", {
mongoose.connect("mongodb://localhost/nodejsplus_blogdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

// router.get("/articles", authMiddleware, async (req, res) => {
router.get("/articles", async (req, res) => {
    // const { userId } = res.locals.user;
    // console.log(userId);
    const articles = await Article.find().sort({createdAt: 'desc'}).exec();
    // console.log(articles); // [{ }, { }, { }]

    const authorIds = articles.map((author) => author.authorId); //  authorId만 추출

    const authorInfoById = await User.find({
	    _id: { $in: authorIds },
    })
    .exec()
    .then((author) =>
      author.reduce(
        (prev, a) => ({
          ...prev,
          [a.authorId]: a,
        }),
        {}
      )
    );
    // console.log(typeof(articles), articles);
    // console.log(typeof(authorIds), authorIds);
    // console.log(typeof(authorInfoById), authorInfoById);
    res.send({
        articles: articles.map((a) => ({
          articleId: a.articleId,
          title: a.title,
          content: a.content,
          createdAt: a.createdAt,
          authorInfo : authorInfoById[a.authorId],
        })),
    }); 
    // res.send({ articles });
});

// 글쓰기 접근 시 사용자 정보를 가져가기 위한 메소드
router.get("/articles/write", authMiddleware, async (req, res) => {
    console.log(res.locals.user);
    const { authorId } = res.locals.user;
    console.log("userID는 : ", authorId);
    const authorInfo = await User.findById(authorId);
    res.status(200).send({
        author: {
            authorId: authorId,
            authorName: authorInfo.authorName,
        }
        
    })
});

// 글 생성, 입력
router.post("/articles/write", async (req, res) => {
	const { authorId, articlePassword, title, content } = req.body;
	console.log(req.body);

	// const postArticle = await Articles.create({ articleId, title, content, authorId, authorName, articlePassword });
	const postArticle = await Article.create({ authorId, articlePassword, title, content });
	// res.json({ article: postArticle });
	res.status(201).json({'result': 'success', 'msg': '글이 등록되었습니다.'})
});

// 코멘트 입력
router.post("/comments/write", async (req, res) => {
	const { authorId, articleId, commentContent } = req.body;
	console.log(req.body);

	// const postArticle = await Articles.create({ articleId, title, content, authorId, authorName, articlePassword });
	const postArticle = await Comment.create({ authorId, articleId, commentContent });
	// res.json({ article: postArticle });
	res.status(201).json({'result': 'success', 'msg': '댓글이 등록되었습니다.'})
});

// 블로그 글 수정 페이지.
app.get("/articles/:articleId/modify", async (req, res) => {
	const { articleId } = req.params;

	const article = await Article.findById(articleId);
    console.log("article은 : " , article);
    console.log("articleId는 : ", article.articleId);
	res.status(200).render('write', {article:article} );
});

router.patch("/articles/:articleId/modify", async (req, res) => {
	const { title, content, authorId, articlePassword, articleId } = req.body;
	const article = await Article.findById(articleId);
	// console.log(article.articlePassword);
	// console.log(articlePassword);
	if (article.articlePassword !== articlePassword){
		res.status(400).json({'result': 'error', 'msg': '비밀번호가 일치하지 않아요..!'}) // 이거 대체 뭘로 줌? response? error?
	} else {
		const modifyArticle = await Article.findByIdAndUpdate(articleId , {$set: {title:title, content:content }});
		res.status(201).json({'result': 'success', 'msg': '글이 수정되었습니다.'})
	}	
});

// 블로그 글 삭제
router.delete("/articles/:articleId/modify", async (req, res) => {
	const { articlePassword, articleId } = req.body;
	const existsArticle = await Article.findById(articleId);

	if (existsArticle) { // existsArticle 이 존재하는 경우 = 쿼리 결과가 있는 경우
		if (existsArticle.articlePassword !== articlePassword){ // 글 지우기 전 입력받은 비밀번호 체크
			res.status(400).json({'result': 'error', 'msg': '비밀번호가 일치하지 않네요.'}) // 이거 대체 뭘로 줌? response? error? xhr?
		} else { 
			await Article.findByIdAndDelete(articleId); // articleId 일치하는 것으로 삭제
			res.status(200).json({'result': 'success', 'msg': '글이 삭제되었습니다.'});
		}
	} else {
        // 올 일은 없지만, id값으로 찾아진게 없다는 것은 멀티 세션으로 같은 글을 동시에 지우려고 했을때?
        res.status(400).json({'result': 'error', 'msg': '게시글이 이미 삭제되었습니다.'})
    }
    
});

//코멘트 수정
router.patch("/comments/:commentId/modify", async (req, res) => {
	const { commentId, articleId, modifiedCommentContent } = req.body;
    console.log("PATCH router comments 들어옴");
    console.log(req.body);
	const comment = await Comment.findById(commentId);
	// console.log(article.articlePassword);
	// console.log(articlePassword);
	// if (comment.commentPassword !== commentPassword){
		// res.status(400).json({'result': 'error', 'msg': '비밀번호가 일치하지 않아요..!'}) // 이거 대체 뭘로 줌? response? error?
	if(comment){
        const modifiedComment = await Comment.findByIdAndUpdate(commentId , {$set: { commentContent: modifiedCommentContent }});
		res.status(201).json({'result': 'success', 'msg': '댓글이 수정되었습니다.'})
    } else {
		res.status(400).json({'result': 'error', 'msg': '댓글 수정에 실패했습니다..'})
	}	
});

// 코멘트 삭제
router.delete("/comments/:commentId/modify", async (req, res) => {
	console.log("delete router comments 들어옴");
    const { commentId } = req.body;
    console.log(req.body);
    console.log(commentId);
	const existsComment = await Comment.findById(commentId);
    console.log(existsComment);

	if (existsComment) { // existsArticle 이 존재하는 경우 = 쿼리 결과가 있는 경우
		await Comment.findByIdAndDelete(commentId); // commentId 일치하는 것으로 삭제
		res.status(200).json({'result': 'success', 'msg': '코멘트가 삭제되었습니다.'});
	} else {
        // 올 일은 없지만, id값으로 찾아진게 없다는 것은 멀티 세션으로 같은 글을 동시에 지우려고 했을때?
        res.status(400).json({'result': 'error', 'msg': '해당 코멘트는 이미 삭제되었습니다.'})
    }
});

/**
 * 회원가입 API. 
 * 특정 pattern을 미리 정규표현식으로 정의하여, 변수로 선언해둔다.
 * postUserSchema 는 authorName, password, confirmPassword에 대해 Joi 라이브러리를 통해 조건을 명시함.
 */

const nickname_pattern = /[a-zA-Z0-9]/ // 닉네임은 알파벳 대소문자 (a~z, A~Z), 숫자(0~9)로 구성하기. flag는 미사용.
const postUserSchema = Joi.object({
    // email: Joi.string().pattern(new RegExp(email_pattern)).required(),
    authorName: Joi.string().min(3).pattern(new RegExp(nickname_pattern)).required(),
    password: Joi.string().min(4).required(),
    confirmPassword: Joi.string().required(),
});
router.post("/users", async (req, res) => {
    try {
        // const { nickname, email, password, confirmPassword } = req.body;
        const { authorName, password, confirmPassword } = await postUserSchema.validateAsync(req.body);

        if (password.includes(authorName)){
            res.status(400).send({
                errorMessage: '비밀번호에 사용자의 아이디는 포함할 수 없습니다.'
            });
            return;
        }

        if (password !== confirmPassword) { // 비밀번호, 비밀번호 확인 일치 여부 확인
            res.status(400).send({
                errorMessage: '비밀번호와 비밀번호 확인의 내용이 일치하지 않습니다.',
            });
            return; // 이 코드 이하의 코드를 실행하지 않고 탈출
        }

        const existUsers = await User.find({
            $or: [{ authorName }],
        });
        if (existUsers.length) { // authorName 중복 데이터가 존재 할 경우
            res.status(400).send({
                errorMessage: '중복된 닉네임입니다.'
            });
            return;
        }

        const user = new User({ authorName, password });
        await user.save();
      
        res.status(201).send({});
    } catch (err) {
        let validationErrorMessage = '요청한 데이터 형식이 올바르지 않습니다.';
        let validationJoiMessage = err.details[0].message;
        // if (validationJoiMessage.includes('email')) { // 올바른 이메일 형식을 입력하지 않은 경우
        //     validationErrorMessage = '올바른 이메일 형식을 입력해주세요.';
        if (validationJoiMessage.includes('authorName')) {
            if (validationJoiMessage.includes('at least 3')){ // 아이디가 3글자 미만인 경우
                validationErrorMessage = '아이디는 3글자 이상이어야 합니다.'
            } else if(validationJoiMessage.includes('fails to match the required pattern')){ // 올바른 아이디 규칙에 맞지 않는 경우
                validationErrorMessage = '아이디는 알파벳 대소문자, 숫자만 사용할 수 있습니다.'
            }
        } else if (validationJoiMessage.includes('password')) { // 비밀번호가 4글자 미만인 경우
            validationErrorMessage = '비밀번호는 4글자 이상이어야 합니다.'
        }
        console.log(err.details[0].message);
        res.status(400).send({
            errorMessage: validationErrorMessage
        });
    }
});

/**
 * 로그인 API. 
 * postAuthSchema 는 email, password에 대해 Joi 라이브러리를 통해 조건을 명시함.
 */
 const postAuthSchema = Joi.object({
    // email: Joi.string().pattern(new RegExp(email_pattern)).required(),
    authorName: Joi.string(),
    password: Joi.string().min(4).required(),
});

router.post("/auth", async (req, res) => {
    try {
        // const { email, password } = req.body;
        const { authorName, password } = await postAuthSchema.validateAsync(req.body);

        const user = await User.findOne({ authorName, password }).exec();
        if (!user) {
            res.status(400).send({
                errorMessage: "닉네임 또는 패스워드를 확인해주세요."
            });
            return;
        }
        console.log(user.authorId);
        console.log(user.authorName);
        console.log(user.password);
        // const token = jwt.sign({ userId: user.userId }, "MY-SECRET-KEY"); // 토큰을 서버쪽에서 sign 하여 생성
        const token = jwt.sign({ authorId: user.authorId }, "MY-SECRET-KEY"); // 토큰을 서버쪽에서 sign 하여 생성
        console.log(token);
        console.log(typeof(token));
        res.send({
            token, // 전달
        });
    } catch (err) {
        console.log(err);
        res.status(400).send({
            errorMessage: "요청한 데이터 형식이 올바르지 않습니다."
        });
    }
});

/**
 * 내 정보 조회 API.
 * 사용자 인증 미들웨어. 경로와 function 사이에 미들웨어 변수를 불러와서 설정할 수 있다.
 */
router.get("/users/me", authMiddleware, async (req, res) => {
    console.log(res.locals);
    console.log(typeof(res.locals));
    /*
     * res.locals 내용 예시
     * [Object: null prototpye] { user: { _id: new ObjectId("61f39afc469383be12e78e81"), email: 'test@test.com', nickname: 'mynickname', password: '1234', __v: 0 }}
     */
    const { user } = res.locals; // user object
    res.send({
        user: {
            authorId: user.authorId,
            authorName: user.authorName,
        },
    });
});





app.get("/", async (req, res) => {
  console.log("메인으로 접근함");
  res.status(200).render('index');  
});

app.get("/signup", async (req, res) => {
  console.log("회원가입 페이지로 접근함");
  res.status(200).render('signup');  
});

app.get("/login", async (req, res) => {
    console.log("로그인 페이지로 접근함");
    res.status(200).render('login');  
});

app.get("/articles/write", async (req, res) => {
    console.log("새로운 글쓰기 페이지입니다");	
    const article = ""; // write.ejs는 modify 부분과 같이 쓰므로, 
    //새 글 쓰기 일 경우 !article 이 true 로 넘길 수 있도록 빈 스트링값 전달
    res.status(200).render('write', {article: article});
});


app.get("/articles/:articleId", async (req, res) => {
    console.log("특정 글읽기 페이지입니다");
    const { articleId } = req.params; // localhost:3000/api/articles/1, 2, ... <- 여기서 req.params는 { articleId : '1' }, articleId = 1
    console.log('-----------------------------');
    console.log(articleId);
    
    const article = await Article.findById(articleId);
    console.log(article);
    const articleAuthor = await User.findById(article.authorId);
    console.log(articleAuthor);
    const comments = await Comment.find({ articleId: articleId }).exec();

    const commentAuthorIds = comments.map((commentAuthor) => commentAuthor.authorId);
    const commentAuthorInfoById = await User.find({
        _id: { $in: commentAuthorIds},
    })
    .exec().then((commentAuthor) => 
    commentAuthor.reduce(
        (prev, ca) => ({
            ...prev,
            [ca.authorId]: ca,
        }),
        {}
        ) 
    );

    const articleInfo = {
        articleId: article._id,
        title: article.title,
        content: article.content,
        authorId: articleAuthor.authorId,
        authorName: articleAuthor.authorName,
        createdAt: article.createdAt
    }
    
    const commentsInfo = comments.map((comment) => ({
        commentId: comment.commentId,
        content: comment.commentContent,
        authorInfo: commentAuthorInfoById[comment.authorId],
        createdAt: comment.createdAt
    }));
    // console.log(typeof(comments), comments); // []
    // console.log(typeof(commentAuthorIds), commentAuthorIds); // []
    // console.log(typeof(commentAuthorInfoById), commentAuthorInfoById); // {}
    console.log(typeof(commentsInfo), commentsInfo);
    
	res.status(200).render('read', { article: articleInfo, commentsInfo: commentsInfo }); // read.ejs 의 내용 render, articleId 값이 일치하는 article 내용 전달
});

app.get("/articles/:articleId/modify", async (req, res) => {
  console.log("특정 글 수정 페이지입니다");
  res.status(200).render('read');
});

const requestMiddleware = (req, res, next) => {
    console.log("Request URL: ", req.originalUrl, " - ", new Date());
    next(); // 하단의 라우터로 이동
}

app.use(requestMiddleware);

app.use("/api", express.urlencoded({ extended: false }), router);
// app.use(express.static("assets"));
app.set('view engine', 'ejs'); // ejs 사용을 위해 view engine 에 ejs set
app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
    console.log(port, "포트로 서버가 요청을 받을 준비가 됐어요");
});