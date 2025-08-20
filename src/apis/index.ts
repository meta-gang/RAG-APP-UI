// import request from './request';

/*
서버와의 통신 방식에 따라 rest api 서버면 주석 해제하고 사용.
socket based 통신이면 다시 연결 구조 잡기
*/
// type 정의는 globals/types 내부에서 진행
type SampleRequestData = {
    data: string
}
type SampleResponseData = {
    data: string
}  

export const sampleApi = ({data}: SampleRequestData): SampleResponseData => {
    // request.get('/api/url');
    return {"data": data};
};