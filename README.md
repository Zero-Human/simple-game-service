# simple-game-service

## 목차

  * [프로젝트 개요](#프로젝트-개요)
      - [ 기술 스택](#기술-스택)
      - [ DB-Modeling](#db-modeling)
      - [ API 문서](#api-문서)
  * [프로젝트 기능 구현내용](#구현-기능-관련)
  * [Test 결과](#test-결과)
  * [설치 및 실행 방법](#설치-및-실행-방법)

## 프로젝트 개요

### 보스레이드 Rest API 입니다.

> 유저 등록, 조회, 보스레이드 상태조회, 보스레이드 시작, 보스레이드 종료, 전체 랭킹 조회기능이 있습니다.<br>
### 개발 기간 
>2022.11.11 ~ 2022.11.15 


## 기술 스택
- Framework: nest.js
- ORM : typeorm
- DB : mysql, redis


## DB Modeling
<img width="229" alt="스크린샷 2022-11-15 오후 9 46 14" src="https://user-images.githubusercontent.com/70467297/201923173-f9f176ff-f756-4b58-9c5e-b8f2b6a6e2aa.png">

user : boss_raid_history = 1 : N
유저를 조회할 때 해당 유저의 boss_raid_history도 같이 조회할 수 있도록 모델링하였습니다.

## API 문서

| 기능구분  | 기능  | Method | URL |  
| ------------- | ------------- | ------------- | ------------- | 
| 유저 | 유저 생성 | POST | /user  |                 
|  | 유저 조회 | GET | /user/:id  | 
| 보스레이드 | 보스상태 조회 | GET  | /bossRaid  |
|  | 보스레이드 시작 | POST | /bossRaid/enter  | 
|  | 보스레이드 종료 | PATCH  | /bossRaid/end |
|  | 보스레이드 랭킹 조회 | GET  | /bossRaid/topRankerList |

## 구현 기능 관련
### 유저 생성
  - 인증없이 바로 유저 생성이 가능합니다.
```
request.body
{
}
response
{
  userId:number
}
```
### 유저 조회
  - 해당 유저의 총 점수와 보스레이드한 기록을 조회하여 결과를 반환해줍니다.
```
request.body
{
}
response
{
  totalScore:number,
  bossRaidHistory: [
  { raidRecordId:number, score:number, enterTime:string, endTime:string },
  //..
  ]
}
```
### 보스상태 조회
  - 현재 보스레이드할 수 있는 상태인지 확인해줍니다.
  - 만약에 누군가 보스레이드를 진행하고 있으면 canEnter: false와 누가 보스레이드 중인지 반환합니다.
  - 보스레이드를 할 수 있는 상태이면 canEnter: true를 반환해줍니다.
```
request.body
{
}
response
{
  canEnter:boolean,
  enteredUserId?:number
}
```
### 보스레이드 시작
  - 유저와 보스레이드 레벨을 보내면 보스레이드를 시작할 수 있는 상태이면 isEntered: true와 raidRecordId를 반환해줍니다.
  - 보스레이드를 시작할수 없다면 isEntered: false로 반환합니다.
  - DB 트렌잭션을 걸어서 여러명이 동시에 보스레이드하는 것을 막아줍니다. 
```
request.body
{
  userId: number;
  level: number;
}
response
{
  isEntered: boolean;
  raidRecordId:number;
}
```
### 보스레이드 종료
  - 보스레이드를 종료하는 기능입니다.
  - 만약 시간초과가 났으면 score 0으로 종료하고 정상적으로 끝났으면 level에 따른 score를 부여해줍니다.
  - 종료시 redis에 user의 내용을 업데이트하여 랭킹을 갱신합니다.
  - DB 트랜잭션을 걸어서 종료에 따른 랭킹이 맞고 보스레이드가 끝날 경우에 다른 유저가 들어갈 수 있도록 해줍니다.
```
request.body
{
  userId: number;
  raidRecordId:number;
}
response
{
}
```
### 보스레이드 랭킹 조회
  - redis에서 유저의 랭킹과 총 랭킹을 조회하여 반환해줍니다.
```
request.body
{
  userId: number;
}
response
{
  topRankerInfoList: RankingInfo[]
  myRankingInfo: RankingInfo
}

RankingInfo = {
ranking: number; 
userId: number;
totalScore: number;
}
```
### 기타
  - joi를 이용하여 환경변수의 유효성을 검사하였습니다.
  - class-validator, class-transformer 및 pipe기능으로 body나 Path 변수의 유효성을 검사하였습니다.
  - Exception filter와 winston을 이용하여 에러 로그를 만들었고 날짜별로 구분하여 로그를 작성하도록 하였습니다.



## Test 결과
### 유닛 테스트
<img src="https://user-images.githubusercontent.com/70467297/202202682-33dd7541-e0d6-4b54-8cef-f793a8e91af7.png"   height="230"/>

### 통합 테스트 
<img src="https://user-images.githubusercontent.com/70467297/202202802-1f9b3cf5-63b5-4e76-960b-84700bed62ac.png"   height="700"/>

## 설치 및 실행 방법
nodejs와 npm이 install 되어있지 않다면 먼저 install 과정 진행
<details>
    <summary> 프로젝트 설치 밀 실행 과정</summary>

<b>1. 프로젝트 clone 및 디렉토리 이동</b>
```bash
git clone https://github.com/Zero-Human/simple-game-service.git

```
<b>2. .env.dev 파일 생성</b>
```bash
DB_USER=
DB_PASSWORD=
DB_PORT=
DB_HOST=
DB_SCHEMA=
SYNCHRONIZE =
LOGGING =
TIMEZONE=
```
<b>3. node package 설치</b>
```javascript
npm install
```
<b>4. 서버 실행</b>
```javascript
npm start
```
</details>

<details>
    <summary>Test 실행 방법</summary>
    
<b>1. .env.test 파일 생성</b>
```bash
DB_USER=
DB_PASSWORD=
DB_PORT=
DB_HOST=
DB_SCHEMA=
SYNCHRONIZE =
LOGGING =
TIMEZONE=
```
<b>2. test 실행</b>
```javascript
npm run test:e2e
```
</details>



