import axios from "axios";

const jwtAxios=axios.create();
const beforeReq=(config)=>{
    const member=JSON.parse(sessionStorage.getItem("member"));
    if(!member){ //로그인하지 않은 사용자
        return Promise.reject({ //에러 정보를 갖는 response객체 생성하기
            respose:{
                data:{
                    error:'REQUIRED_LOGIN'
                }
            }
        })
    }
    const {accessToken}=member;
    config.headers.Authorization=`Bearer ${accessToken}`;
    // 리턴된 config에 설정된 값들이 request객체에 적용된다.
    return config;
}

const refreshJWT=async(accessToken,refreshToken)=>{
    const header={headers:{"Authorization":`Bearer ${accessToken}`}}
    const res=await axios.get(`/api/member/refresh?refreshToken=${refreshToken}`,
        header
    );
    console.log("refresh===>",res);
    return res.data;
}

const beforeRes=async(res)=>{
    const data=res.data;
    if(data && data.error=="ERROR_ACCESS_TOKEN"){//액세스 토큰이 유효하지 않은 경우
        //리프레쉬 토큰을 보내서 새로운 액세스토큰 받아오기
        const member=JSON.parse(sessionStorage.getItem("member"));
        const result=await refreshJWT(member.accessToken,member.refreshToken);
        member.accessToken=result.accessToken;
        member.refreshToken=result.refreshToken;
        //변경된 정보로 세션스토리지에 다시 저장
        sessionStorage.setItem("member",JSON.stringify(member));
        //원래 요청했던 url정보 얻어오기(새로운 액세스토큰으로 다시 요청하기 위해)
        const originalRequest=res.config;
        originalRequest.headers.Authorization=`Bearer ${result.accessToken}`;
        //새로운 액세스토큰을 가지고 다시 요청하기
       return await jwtAxios(originalRequest);
    }
    return res;
}
const requestFail=(err)=>{
    return Promise.reject(err);
}
const responseFail=(err)=>{
    return Promise.reject(err);
}
//서버에 요청하기 전에 beforeReq함수가 호출되고 요청이 실패하면 requestFail함수가 호출된다.
jwtAxios.interceptors.request.use(beforeReq,requestFail);
//서버에서 온 데이터를 응답하기 전에 beforeRes함수가 호출되고 응답이 실패하면 responseFail함수가 호출된다.
jwtAxios.interceptors.response.use(beforeRes,responseFail);

export default jwtAxios;