const express = require("express");
const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Article = require("./models/blog");
const Comment = require("./models/comment");
const res = require("express/lib/response");
// const authMiddleware = require("./middlewares/auth-middleware");
// const Joi = require('joi');
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

// router.get("/articles/:articleId", async (req, res) => {
//   console.log("들어왔니?");
// 	const { articleId } = req.params; // localhost:3000/api/articles/1, 2, ... <- 여기서 req.params는 { articleId : '1' }, articleId = 1
//   const article = await Article.findById(articleId).exec();
//   console.log(article);
// 	// const [article] = await Articles.find({ articleId: Number(articleId) });
// 	res.send({ article: article } ); // read.ejs 의 내용 render, articleId 값이 일치하는 article 내용 전달
// });

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