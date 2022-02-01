const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = (req, res, next) => {
    
    const { authorization } = req.headers;
    // console.log("req.headers? : ", req.headers); // 헤더 어디감?
    console.log("authorization : ", authorization);
    // if (authorization === undefined){
    //     res.status(401).send({
    //         errorMessage: '로그인이 필요한 페이지 입니다.',
    //     })
    //     return;
    // }
    const [tokenType, tokenValue] = authorization.split(' '); // 공백을 기준으로 잘라 배열로 반환.
    // console.log(tokenValue);

    // tokenType 값이 'Bearer' 가 아닌 경우 토큰값이 없다고 판별하고 튕겨냄.
    // .. 라고 생각했는데, localStorage를 비우고 난 후에 주소로 접근하면 "Bearer null" 로 들어옴.
    if (tokenType !== 'Bearer'){
        res.status(401).send({
            errorMessage: '로그인이 필요한 페이지 입니다.',
        });
        return;
    }
    try {
        const { authorId } = jwt.verify(tokenValue, "MY-SECRET-KEY"); // 유효한 토큰인지 확인. verify
        // const user = User.findById(userId).exec(); // 이렇게 해서 찾아왔던 user를, 아래 구문과 같이 변경
        User.findById(authorId).exec().then((user) => {
            res.locals.user = user; // res.locals 를 사용하면 이 미들웨어를 거쳐가는 다른 곳에서도 다 공통적으로 사용할 수 있음.
            next();
        });
    } catch (error) {
        console.log("auth middleware에서 에러"); // 사용자 로그인하지 않고, 직접 localhost:8080/articles 로 접속하면 여기로 진입
        res.status(401).send({
            errorMessage: '로그인이 필요한 페이지 입니다.',
        });
        return;
    }
};