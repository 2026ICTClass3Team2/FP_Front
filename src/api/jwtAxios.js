import axios from "axios";

const jwtAxios=axios.create({
    baseURL: "http://localhost:8080" // 모든 요청의 기본 URL을 백엔드 서버로 설정
});
const beforeReq=(config)=>{
    const token = localStorage.getItem("token"); // AuthContext와 동일하게 localStorage에서 토큰 가져오기
    if(!token){ //로그인하지 않은 사용자
        return Promise.reject({ //에러 정보를 갖는 response객체 생성하기
            response:{ // 오타 수정 (respose -> response)
                data:{
                    message:'로그인이 필요한 서비스입니다.'
                }
            }
        })
    }
    config.headers.Authorization=`Bearer ${token}`;
    // 리턴된 config에 설정된 값들이 request객체에 적용된다.
    return config;
}

const refreshJWT=async(accessToken,refreshToken)=>{
    const header={headers:{"Authorization":`Bearer ${accessToken}`}}
    // 백엔드 주소가 누락되어 통신에 실패하지 않도록 전체 URL을 명시합니다.
    const res=await axios.get(`http://localhost:8080/api/member/refresh?refreshToken=${refreshToken}`,
        header
    );
    console.log("refresh===>",res);
    return res.data;
}

const beforeRes=async(res)=>{
    return res;
}
const requestFail=(err)=>{
    return Promise.reject(err);
}
const responseFail=async(err)=>{
    const data = err.response?.data;
    
    // 백엔드에서 401 에러와 함께 ERROR_ACCESS_TOKEN을 반환한 경우 (만료 등)
    if(data && data.error === "ERROR_ACCESS_TOKEN"){
        try {
            const token = localStorage.getItem("token");
            const user = JSON.parse(localStorage.getItem("user")) || {};
            
            // 리프레쉬 토큰으로 새로운 액세스 토큰 요청
            const result = await refreshJWT(token, user.refreshToken); 
            
            localStorage.setItem("token", result.accessToken); // 갱신된 토큰 다시 저장
            
            // 원래 실패했던 요청의 설정(config)을 가져와서 토큰만 교체
            const originalRequest = err.config;
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
            
            // 갱신된 토큰으로 사용자가 원래 하려던 요청(게시글 작성 등)을 다시 시도
            return await jwtAxios(originalRequest);
        } catch (refreshErr) {
            // 리프레시 토큰까지 만료되었거나 갱신 실패 시 완벽하게 로그아웃 처리
            alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login"; // 로그인 페이지로 강제 이동
            return Promise.reject(refreshErr);
        }
    }
    return Promise.reject(err);
}
//서버에 요청하기 전에 beforeReq함수가 호출되고 요청이 실패하면 requestFail함수가 호출된다.
jwtAxios.interceptors.request.use(beforeReq,requestFail);
//서버에서 온 데이터를 응답하기 전에 beforeRes함수가 호출되고 응답이 실패하면 responseFail함수가 호출된다.
jwtAxios.interceptors.response.use(beforeRes,responseFail);

export default jwtAxios;