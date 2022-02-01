function getSelfInfo(callback) {
    $.ajax({
        type: "GET",
        url: "/api/users/me",
        headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        success: function (response) {
            // alert("회원인데요?");
            // alert(response.user.authorId);
            callback(response.user);
        },
        error: function (xhr, status, error) {
            // if (status == 401) {
            //     alert(localStorage);
            //     alert("로그인이 필요합니다.");
            // } else {
            //     alert(localStorage);
            //     localStorage.clear();
            //     alert("알 수 없는 문제가 발생했습니다. 관리자에게 문의하세요.");
            // }
            // alert("비회원입니다.");
            // window.location.href = "/login";
            console.log("사용자 정보 없음");
        },
    });
}


// 유저 정보를 가져오는 함수
function getSelf(callback) {
    // alert("get self 실행");
    $.ajax({
        type: "GET",
        url: "/api/users/me",
        headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        success: function (response) {
            callback(response.user);
        },
        error: function (xhr, status, error) {
            if (status == 401) {
                alert("로그인이 필요합니다.");
            } else {
                localStorage.clear();
                alert("알 수 없는 문제가 발생했습니다. 관리자에게 문의하세요.");
            }
            window.location.href = "/login";
        },
    });
}

function signOut() {
    if(confirm("로그아웃 하시겠습니까?")){
        alert("로그아웃 되었습니다.")
        localStorage.clear();
        window.location.href = "/login";
    } else {
        return false;
    }
}