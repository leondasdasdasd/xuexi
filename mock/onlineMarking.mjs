export default {
  "/api/onlineMarking/getMeCheckQuestionUser": {
    ifLogin: false,
    status: true,
    message: "",
    code: 0,
    content: [],
    ifAdmin: false,
  },
  "/api/onlineMarking/questionIdOrPieceForResult": {
    ifLogin: true,
    status: true,
    message: "成功",
    code: 0,
    content: [
      {
        questionSettingIdList: [75_849],
        questionInfo: "1",
        currentStatus: false,
        allDone: false,
        markingType: 1,
      },
    ],
    ifAdmin: false,
  },
  "/api/onlineMarking/getMeCheckQuestionUserForResult": {
    ifLogin: true,
    status: true,
    message: "成功",
    code: 0,
    content: [
      {
        index: 1,
        studentId: 100_000_261_375,
        studentName: "BBK测试12",
        studentEnName: "",
        score: "1.0",
        scoreUploadStatus: false,
        pending: true,
        currentStatus: false,
      },
    ],
    ifAdmin: false,
  },
  "/api/onlineMarking/questionImageForResult": {
    ifLogin: true,
    status: true,
    message: "成功",
    code: 0,
    content: {
      checkNum: 3,
      allNum: 3,
      studentQuestionAnswer: {
        studentId: 52_332,
        studentName: null,
        questionImageUrl: null,
        tag: null,
        questionInfo: [
          {
            questionId: "10536",
            questionSerialNumber: "4",
            quesionImageUrl: null,
            questionType: 5,
            questionScore: "10.0",
            studentScore: "10.0",
            questionContent:
              " 鲁迅说小时候仇猫是因它欺负弱小,长大后却发现有些人比猫更虚伪。你生活中有没有类似的‘长大后才发现真相’的经历?请简单分享。",
            studentAnswer:
              '<p><span style="color:#000000">请输入 Please fill in here</span></p><p></p><div class="media-wrap image-wrap"><img loop="" controls="" src="https://task.daily.yungu-inc.org/api/preview_file?id=681549"/></div><p></p>',
            isCorrect: 1,
            studentGapFillingAnswer: null,
            sonQuestionList: null,
            tag: null,
            teacherAnnotation:
              '{"canvasSize":{"width":"789","height":"1264"},"version":"5.4.2","objects":[{"type":"textbox","version":"5.4.2","originX":"left","originY":"top","left":594.34,"top":663.5,"width":50.05,"height":36.16,"fill":"#ff0000","stroke":"#ff0000","strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"fontFamily":"Times New Roman","fontWeight":"normal","fontSize":32,"text":"+10","underline":false,"overline":false,"linethrough":false,"textAlign":"left","fontStyle":"normal","lineHeight":1.16,"textBackgroundColor":"","charSpacing":0,"styles":[],"direction":"ltr","path":null,"pathStartOffset":0,"pathSide":"left","pathAlign":"baseline","minWidth":20,"splitByGrapheme":false,"customType":"numberText"}]}',
          },
        ],
      },
    },
    ifAdmin: false,
  },
  "POST /api/onlineMarking/checkQuestionForResult": {
    ifLogin: true,
    status: true,
    message: "",
    code: 0,
    content: [],
    ifAdmin: false,
  },
};
