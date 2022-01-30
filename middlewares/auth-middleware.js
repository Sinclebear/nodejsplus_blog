const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' '); // 공백을 기준으로 잘라 배열로 반환.
    // console.log(tokenValue);

    // tokenType 값이 'Bearer' 가 아닌 경우 토큰값이 없다고 판별하고 튕겨냄.
    if (tokenType !== 'Bearer'){
        res.status(401).send({
            errorMessage: '로그인이 필요한 페이지 입니다.',
        });
        return;
    }
    try {
        const { userId } = jwt.verify(tokenValue, "MY-SECRET-KEY"); // 유효한 토큰인지 확인. verify
        // const user = User.findById(userId).exec(); // 이렇게 해서 찾아왔던 user를, 아래 구문과 같이 변경
        User.findById(userId).exec().then((user) => {
            res.locals.user = user; // res.locals 를 사용하면 이 미들웨어를 거쳐가는 다른 곳에서도 다 공통적으로 사용할 수 있음.
            next();
        });
    } catch (error) {
        res.status(401).send({
            errorMessage: '로그인이 필요한 페이지 입니다.',
        });
        return;
    }
};