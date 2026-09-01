//按班级查看统计分析
export default {
  "GET /api/check/permission": {
    ifLogin: true,
    status: true,
    message: "成功",
    code: 0,
    content: true,
    ifAdmin: false,
  },
};
