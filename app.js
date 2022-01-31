const express = require("express");
const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Article = require("./models/blog");
const Comment = require("./models/comment");
const res = require("express/lib/response");
// const authMiddleware = require("./middlewares/auth-middleware");
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
    const articles = await Article.find().sort({createdAt: 'desc'}).exec();
    console.log(articles); // [{ }, { }, { }]
    console.log('-------------------');
    console.log(articles[0].articleId);

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
        if (validationJoiMessage.includes('nickname')) {
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

const requestMiddleware = (req, res, next) => {
    console.log("Request URL: ", req.originalUrl, " - ", new Date());
    next(); // 하단의 라우터로 이동
}

app.use(requestMiddleware);

app.use("/api", express.urlencoded({ extended: false }), router);
// app.use(express.static("assets"));
app.set('view engine', 'ejs'); // ejs 사용을 위해 view engine 에 ejs set
app.use(express.static(__dirname + '/public'));

app.get("/", async (req, res) => {
  console.log("메인으로 접근함");
  res.status(200).render('index');  
});

app.get("/signup", async (req, res) => {
  console.log("회원가입 페이지로 접근함");
  res.status(200).render('signup');  
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



app.listen(port, () => {
    console.log(port, "포트로 서버가 요청을 받을 준비가 됐어요");
});