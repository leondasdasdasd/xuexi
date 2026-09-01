export const courseList = {
  status: true,
  message: "成功",
  code: 1001,
  ifLogin: true,
  content: [
    {
      courseId: 224,
      courseName: "科学G8",
      coursePicture: null,
      schoolYearName: "2020学年",
      schoolYearId: 5,
      isContains: 1,
    },
    // {
    //   courseId: 74,
    //   courseName: "历史G7",
    //   coursePicture: null,
    //   schoolYearName: "2020学年",
    //   schoolYearId: 5,
    //   isContains: 0,
    // },
    // {
    //   courseId: 78,
    //   courseName:
    //     "我是我是我是我是历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7",
    //   coursePicture: null,
    //   schoolYearName: "2020学年",
    //   schoolYearId: 5,
    //   isContains: 0,
    // },
  ],
};

export const activityList = {
  status: true,
  message: "成功",
  code: 1001,
  ifLogin: true,
  content: [
    {
      id: 128,
      semesterId: 9,
      courseId: 224,
      name: "单元1",
      ename: null,
      status: 2,
      orgId: null,
      activityResponseList: [
        {
          id: 186,
          unitId: 128,
          name: "丁活动",
          ename: null,
          description: null,
          classHour: null,
        },
        {
          id: 126,
          unitId: 128,
          name: "我是我是我是我是历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7历史G7丁活动",
          ename: null,
          description: null,
          classHour: null,
        },
      ],
    },
    {
      id: 137,
      semesterId: 9,
      courseId: 224,
      name: "题库回归测试题库回归测试题库回归测试题库回归测试题库回归测试题库回归测试题库回归测试题库回归测试题库回归测试",
      ename: null,
      status: 2,
      orgId: null,
      activityResponseList: [
        {
          id: 198,
          unitId: 137,
          name: "回归活动1",
          ename: null,
          description: null,
          classHour: "4.5",
        },
        {
          id: 203,
          unitId: 137,
          name: "bug验证活动1",
          ename: null,
          description: null,
          classHour: null,
        },
      ],
    },
    {
      id: 117,
      semesterId: 9,
      courseId: 294,
      name: "新单元",
      ename: null,
      status: 2,
      orgId: null,
      activityResponseList: [],
    },
  ],
};

export const groupList = {
  status: true,
  message: "成功",
  code: 1001,
  ifLogin: true,
  content: [
    {
      unitId: 91,
      groupCourseId: 220,
      studentGroupName: "八（云）",
      studentGroupEnglishName: "Grade 8 Class Yun",
      teacherList: [
        {
          teacherId: 73,
          name: "裴桐",
          ename: "Periny",
          avatarId: null,
          avatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/e4a11ba0-c1a7-4bf6-8c5d-55907b3fcb90",
          userUnionId: "e4a11ba0-c1a7-4bf6-8c5d-55907b3fcb90",
          isCurrentTeacher: false,
        },
      ],
      studentList: [
        {
          id: 1651,
          name: "谢洋",
          englishName: "Frank",
          stuAvatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/f2e011b4-bbb0-4d7c-914c-cff6c623c397",
          userUnionId: "f2e011b4-bbb0-4d7c-914c-cff6c623c397",
          groupId: 220,
        },
        {
          id: 1652,
          name: "刘乐童",
          englishName: "Grace",
          stuAvatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/ce16d639-2784-4aa2-99b7-f3a8eb9713df",
          userUnionId: "ce16d639-2784-4aa2-99b7-f3a8eb9713df",
          groupId: 220,
        },
        {
          id: 1653,
          name: "李天",
          englishName: "Sky",
          stuAvatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/e467d54d-56e2-465d-8cd2-3dbecb4e2884",
          userUnionId: "e467d54d-56e2-465d-8cd2-3dbecb4e2884",
          groupId: 220,
        },
      ],
      groupCourseTeacherNumbers: 4,
      groupCourseStudentNumbers: 21,
    },
    {
      unitId: 91,
      groupCourseId: 221,
      studentGroupName: "八（谷）",
      studentGroupEnglishName: "Grade 8 Class Gu",
      teacherList: [
        {
          teacherId: 73,
          name: "裴桐",
          ename: "Periny",
          avatarId: null,
          avatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/e4a11ba0-c1a7-4bf6-8c5d-55907b3fcb90",
          userUnionId: "e4a11ba0-c1a7-4bf6-8c5d-55907b3fcb90",
          isCurrentTeacher: false,
        },
        {
          teacherId: 29,
          name: "丁义",
          ename: "Yi Ding",
          avatarId: null,
          avatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/a0cbf894-9ab6-4a51-9146-4d8723337429",
          userUnionId: "a0cbf894-9ab6-4a51-9146-4d8723337429",
          isCurrentTeacher: true,
        },
      ],
      studentList: [
        {
          id: 1658,
          name: "郑博维",
          englishName: "Season",
          stuAvatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/bd291e80-1748-4f90-9cbf-584bb8b8a0d7",
          userUnionId: "bd291e80-1748-4f90-9cbf-584bb8b8a0d7",
          groupId: 221,
        },
        {
          id: 1659,
          name: "张舒琦",
          englishName: "Sandy",
          stuAvatar:
            "http://userservice.api.yungu-inc.org/api/user/avatarUrl/c4928a12-fcd3-4a5e-9e58-f6172455c719",
          userUnionId: "c4928a12-fcd3-4a5e-9e58-f6172455c719",
          groupId: 221,
        },
      ],
      groupCourseTeacherNumbers: 4,
      groupCourseStudentNumbers: 21,
    },
  ],
};

export const allTeachersData = {
  status: true,
  message: "成功",
  code: 1001,
  ifLogin: true,
  content: [
    {
      teacherId: 2,
      name: "机构管理员 ",
      ename: null,
      avatarId: null,
      avatar: null,
      userUnionId: "bcc09e9b-9d6a-4b4c-9f19-46e20dc416b7",
    },
    {
      teacherId: 12,
      name: "刘艺兰Alice Alice Liu",
      ename: null,
      avatarId: null,
      avatar:
        "https://yungu-record-public2.oss-cn-hangzhou.aliyuncs.com/aff4aa9f-6246-42ce-a884-7b9dcdcf4bf3.png?x-oss-process=image/crop,x_1075,y_0,w_1997,h_2000",
      userUnionId: "233",
    },
    {
      teacherId: 73,
      name: "裴桐",
      ename: "Periny",
      avatarId: null,
      avatar:
        "http://userservice.api.yungu-inc.org/api/user/avatarUrl/e4a11ba0-c1a7-4bf6-8c5d-55907b3fcb90",
      userUnionId: "e4a11ba0-c1a7-4bf6-8c5d-55907b3fcb90",
    },
    {
      teacherId: 29,
      name: "丁义",
      ename: "Yi Ding",
      avatarId: null,
      avatar:
        "http://userservice.api.yungu-inc.org/api/user/avatarUrl/a0cbf894-9ab6-4a51-9146-4d8723337429",
      userUnionId: "a0cbf894-9ab6-4a51-9146-4d8723337429",
    },
  ],
};

export const taskPublishLearn = {
  status: true,
  message: "成功",
  code: 1001,
  ifLogin: true,
  content: { examId: 123, taskId: 888, evaluationItemId: 99 }, //taskId
  //   "content": [
  //     {
  //       "groupId": 220,
  //       "learnListId": 120,
  //       "taskId": 123
  //     },
  //     {
  //       "groupId": 221,
  //       "learnListId": 23,
  //       "taskId": 122
  //     },
  //     {
  //       "groupId": 212,
  //       "learnListId": 223,
  //       "taskId": 222
  //     }
  //   ]
};
