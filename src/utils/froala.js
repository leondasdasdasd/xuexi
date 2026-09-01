import $ from "jquery";

import { trans } from "./i18n";

/**
 *
 * @param string_
 */
function DBCToSBC(string_) {
  //全角字符转成半角字符
  var result = "";
  for (var index = 0; index < string_.length; index++) {
    var code = string_.charCodeAt(index); //获取当前字符的unicode编码
    if (code >= 65_281 && code <= 65_373) {
      //在这个unicode编码范围中的是所有的英文字母已经各种字符
      let d = string_.charCodeAt(index) - 65_248;
      result += String.fromCharCode(d); //把全角字符的unicode编码转换为对应半角字符的unicode码
    } else if (code == 12_288) {
      //空格
      let d = string_.charCodeAt(index) - 12_288 + 32;
      result += String.fromCharCode(d);
    } else {
      result += string_.charAt(index);
    }
  }
  return result;
}

/**
 *
 * @param value
 * @param detail
 * @param number_
 */
function getClassify(value, detail, number_) {
  detail.push({
    name: value,
    type: number_,
  });
  return detail;
}

/**
 *
 * @param tar
 * @param title
 * @param dataType
 * @param inputType
 */
function changeType(tar, title, dataType, inputType) {
  tar.parent().siblings(".type-name").text(title);
  tar
    .parents(".qt_title")
    .siblings(".key")
    .find("input")
    .attr("type", dataType);
  tar.parents(".question").attr("data-type", inputType);
}

//标记答案
/**
 *
 * @param type
 * @param ii
 */
function markAnswer(type, ii) {
  var list = ["A", "B", "C", "D", "E", "F", "G", "H"];

  $(".question")
    .eq(ii)
    .each(function (index, element) {
      var $that = $(this);
      var titleNumber = $(this).find(".type-box .title").text();
      var answerText = $(this)
        .find(".qt_answer")
        .text()
        .replace(/^\s*答案\S+?\s*[:：]/, "");
      //word版多选题带,号处理
      if (/^([a-h][,|，]){0,7}([a-h])$/i.test(answerText)) {
        answerText = answerText.replaceAll(/,|，/g, "");
      }
      var answer = answerText.toUpperCase();
      //处理下只有图片的情况
      var checkTitle = $(this)
        .find(".qt_title")
        .text()
        .replace($(this).find(".type-box").text(), "");

      if (
        $.trim(checkTitle) === "" &&
        $(this).find(".qt_title img").length === 0
      ) {
        $(this)
          .find(".qt_title")
          .addClass("qt_error")
          .html("题目（至少两个字)");
      }
      //检查是否按顺序排序
      var select = $(this).find(".key .title").text();
      var type = $(this).data("type");
      select = select && select.split(".").join("");

      //处理题目中的题号带括号，替换下中文括号
      titleNumber = titleNumber.replace(/（/, "(");
      titleNumber = titleNumber.replace(/）/, ")");
      $(this).find(".type-box .title").text(titleNumber);

      //错误标记check_error
      if ($(this).find(".error,.qt_error").length > 0) {
        $(this).addClass("check_error");
      }

      if (type == "1" || type == "2") {
        for (var k = 0, selectLength = select.length; k < selectLength; k++) {
          //根据选项与ACSII的比较，判断是否为正常的排序及重复选项的存在
          if (!(select[k] === String.fromCharCode(65 + k))) {
            $(this).addClass("check_error");
            $(this).find(".key").addClass("qt_error");
          }
        }
        for (
          var index_ = 0, listLength = list.length;
          index_ < listLength;
          index_++
        ) {
          //标记选项框
          if (answer.search(list[index_]) == -1) {
            $(this)
              .find(".key_" + list[index_] + " .checkOrRadio")
              .attr("disabled", true);
          } else {
            $(this)
              .find(".key_" + list[index_] + " .checkOrRadio")
              .prop("checked", true);
          }
        }

        //根据选项最后一位的ASCII码 与选项对比小于即为不存选项（大写比较）
        //单选题判断答案是否存在
        // 过滤空字符串
        var answerhandle = answer.split("").filter(function (message) {
          return message && message.trim();
        });
        //单选题判断答案是否存在
        if (
          answerhandle.length === 1 &&
          select.slice(-1).charCodeAt() <
            answerhandle[0].toLocaleUpperCase().charCodeAt()
        ) {
          $that.addClass("check_error");
          $that
            .find(".qt_answer")
            .removeAttr("hidden")
            .addClass("qt_error")
            .text("答案不存在！");
        }

        // 多选题判断答案是否存在
        if (answerhandle.length > 1) {
          for (
            var index__ = 0, answerLength = answerhandle.length;
            index__ < answerLength;
            index__++
          ) {
            if (
              answerhandle[index__].charCodeAt() > select.slice(-1).charCodeAt()
            ) {
              $that.addClass("check_error");
              $that
                .find(".qt_answer")
                .removeAttr("hidden")
                .addClass("qt_error")
                .text("答案不存在！");
            }
          }
        }

        //题目有错误时把单多选按钮隐藏
        if ($(this).find(".qt_error").length > 0) {
          $(this).find(".change-type").hide();
        } else {
          $(this).find(".change-type").show();
        }
      }

      if (type == "4") {
        //  填空题括号与答案对应，先进行空元素匹配，在进行重复答案匹配
        var fillReg = /([(^|\uFF08]\s*[)^|\uFF09])/g;
        var newAnswer = [];
        if (
          $(this).find(".qt_title").text().match(fillReg) ||
          /_+/.test($(this).find(".qt_title").text())
        ) {
          var fillNumber =
            $(this).find(".qt_title")?.text()?.match(fillReg)?.length ||
            $(this).find(".qt_title").text().match(/_+/g).length;
          // console.log($(this).find(".qt_title").text().match(/_/g), "111");
        }
        var answerNumber = answerText.split("|");
        console.log(
          fillNumber,
          $(this).find(".qt_title").text().match(fillReg),
          "jijo",
        );
        // 先判断长度是否相等
        console.log(answerNumber, fillNumber, "hhb");
        if (fillNumber === answerNumber.length) {
          //去除空元素
          for (const value of answerNumber) {
            if ($.trim(value)) {
              newAnswer.push(value);
            }
          }
          if (fillNumber !== newAnswer.length) {
            $(this).addClass("check_error");
            //长度不相等即为错
            $(this).find(".qt_answer").addClass("qt_error");
          }
        } else {
          $(this).addClass("check_error");
          //长度不相等即为错
          $(this).find(".qt_answer").addClass("qt_error");
        }
      }

      if (
        type == "5" && //问答题答案为空时标记为错误
        answerText.length === 0
      ) {
        $(this).addClass("check_error");
        $(this).find(".qt_answer").addClass("qt_error");
      }
    });

  //单选多选相互转化
  $(".change-type input").click(function () {
    if ($(this).is(":checked")) {
      $(this)
        .parent()
        .siblings()
        .removeClass("type-name-1")
        .addClass("type-name-2");
      changeType($(this), "多选题", "checkbox", 2);
    } else {
      $(this)
        .parent()
        .siblings()
        .removeClass("type-name-2")
        .addClass("type-name-1");
      changeType($(this), "单选题", "radio", 1);
    }
  });
}

//当题号过长时改变题号
/**
 *
 * @param ii
 */
function changeSize(ii) {
  $(".question .qt_title .title")
    .eq(ii)
    .each(function (index, element) {
      var $numberWords = $(this).text().length;
      if ($numberWords == 4) {
        $(this).css({ "font-size": "20px" });
      } else if ($numberWords == 5) {
        $(this).css({ "font-size": "16px" });
      } else if ($numberWords > 5) {
        $(this).css({ "font-size": "14px" });
      }
    });
}

/**
 *
 * @param _this
 * @param item
 */
export function initFroala(_this, item) {
  var fillReg = /([(^|\uFF08]\s*[)^|\uFF09])/g;
  var nameReg =
    /^\s*((\d+\s*[.|、．])|(((\()|（)\d+((\))|）)))\s*(.*?)\s*(?:\n|$)/g;
  // var singleReg = /^\n?\s*(答案[(（(（]\S+?[)））)][:：])\s*(.*?)\s*(?:\n|$)/g;
  var singleReg =
    /^\s*(答案\S+?[:：]|answer[:：]|Answer[:：]|ANSWER[:：]|答案[:：])\s*(.*?)\s*(?:\n|$)/g;
  var reg4 = /style="[^=>]*"([\s\w()+=>|])/g;
  var reg5 = /style='[^=>]*'([\s\w()+=>|])/g;
  $("#preview").html("");
  var newArray = [];
  var indexArray = [];
  var questionArray = [];
  var detail = [];
  window.localStorage.setItem("yungu_question", _this.html.get());
  let textReplaceStyle = _this.html.get();
  const hh = textReplaceStyle.replaceAll(
    /<img [^>]*style=["']([^"']+)[^>]*>/gi,
    (a, b, c) => {
      // return a.replace('style="','style-data=');
      return a.replace('style="', 'style-data="');
    },
  );
  console.log(hh, "rre");
  const newHTml = hh
    .replaceAll(reg4, "$1")
    .replaceAll(reg5, "$1")
    .replaceAll("style-data=", "style=");
  console.log(newHTml, "rre1");
  console.log(hh, "textReplaceStyle");
  var htmlContent = newHTml
    .replaceAll("<div>", "\n\n")
    .replaceAll("<div >", "\n\n")
    .replaceAll("</div>", "\n\n")
    .replaceAll(/<p( id="\d+")?>/g, "\n\n")
    .replaceAll(/<p( id="\d+")?>/g, "\n\n")
    .replaceAll("</p>", "\n\n")
    .replaceAll("<br>", "\n\n")
    .replaceAll("<br >", "\n\n")
    .replaceAll('auto;">', 'auto;">\n\n');
  var contentText = DBCToSBC(htmlContent).split("\n");
  for (let value of contentText) {
    if (value) {
      value = value.replaceAll("&nbsp;", " ");
      value = "&nbsp;&nbsp;&nbsp;" + value;
      value = value.replaceAll("&nbsp;", "\n");

      newArray.push(value);
    }
  }
  //寻找相应的下标
  for (const [index, value] of newArray.entries()) {
    if (value.match(nameReg)) {
      indexArray.push(index);
    }
  }
  //截取完整小题
  for (const [index, value] of indexArray.entries()) {
    questionArray.push(
      newArray.slice(indexArray[index], indexArray[index + 1]),
    );
  }
  //$('.batch-preview-box .toolbar .title').text(questionArr.length > 0 ? '检查区(共' + questionArr.length + '题)：' : '检查区：');
  //判断题型，赋值qt_type
  for (let value of questionArray) {
    var allValue = value.join(" ");
    var completionReg = /_+/g;
    //匹配没有答案的情况(  答案：/【答案】)
    var regular1 = /\n\s*【\s*答案\s*】\s*/g,
      regular2 = /\n\s*(答案\S+?[:：])\s*/g,
      regular3 = /\n\s*(answer[:：])\s*/g,
      regular4 = /\n\s*(Answer[:：])\s*/g,
      regular5 = /\n\s*(ANSWER[:：])\s*/g,
      regular6 = /\n\s*(答案[:：])\s*/g;
    if (
      !allValue.match(regular1) &&
      !allValue.match(regular2) &&
      !allValue.match(regular3) &&
      !allValue.match(regular4) &&
      !allValue.match(regular5) &&
      !allValue.match(regular6)
    ) {
      //匹配到选项存在则默认为单选题先判断是否带有a.类似标志
      if (/\n\s*[a-h]\s*[.|、]/i.test(allValue)) {
        getClassify(value, detail, 1);
      } else if (fillReg.test(allValue) || completionReg.test(allValue)) {
        //在判断是否带有（）
        getClassify(value, detail, 4);
      } else {
        //否则默认为问答题
        getClassify(value, detail, 5);
      }
    } else {
      var answerReg = /^\s*【\s*答案\s*】\s*/;
      var answerJude =
        /\n{3}\s*【\s*答案\s*】|\n{3}\s*(答案\S+?[:：]|answer[:：]|Answer[:：]|ANSWER[:：]|答案[:：])/g;
      //针对存在多个答案的情况
      if (allValue.match(answerJude).length > 1) {
        for (const [index, ele] of value.entries()) {
          if (ele.match(answerJude)) {
            value = value.slice(0, index + 1);
          }
        }
      }
      for (let value_ of value) {
        // 处理下中文括号
        if (answerReg.test(value_)) {
          value_ = value_.replace(answerReg, "答案：");
        }
        //只有答案两个字的情况
        if (/^\s*答案\s*$/.test(value_)) {
          value_ = value_.replace(/^\s*(答案)\s*/, "答案：");
        }
        if (value_.match(singleReg)) {
          var m = value_.match(singleReg); //匹配答案项
          var isAnswer = m[0].replace(
            /^\s*(答案\S+?[:：]|answer[:：]|Answer[:：]|ANSWER[:：]|答案[:：])\s*/,
            "",
          ); //寻找答案后的字符串
          //有答案字段，没有正确的答案
          console.log(isAnswer, "isis");
          if (isAnswer) {
            //word版多选题带,号处理
            if (/^([a-h][,|，]){0,7}([a-h])$/i.test(isAnswer)) {
              isAnswer = isAnswer.replaceAll(/,|，/g, "");
            }
            var isSelect = isAnswer.match(/^\s*[a-h]{1,8}\s*(?:\n|$)/i); //单选/多选
            var isJude = isAnswer.match(
              /^\s*(正确|错误|对|错|true|false)\s*(?:\n|$)/i,
            ); //判断
            var isSelects = []; //该数组用于接收处理完空字符串之后的isSelect
            // 针对大小写选项重复
            if (isSelect) {
              //  数组去重
              isSelect = isSelect[0]
                .split("")
                .filter(function (ele, index, array) {
                  return array.indexOf(ele) === index;
                });
              //二次处理isSelect,去除空字符串
              for (const value1 of isSelect) {
                if ($.trim(value1)) {
                  isSelects.push(value1);
                }
              }
              //排序
              isSelects.sort();

              //1，2项比较是否为同一个选项(a,A)
              if (
                isSelects.length === 2 &&
                isSelects[0].toLocaleLowerCase() === isSelects[1]
              ) {
                isSelects = isSelects.splice(0, 1);
              }
            }
            //单选题
            if (isSelects && isSelects.length === 1) {
              getClassify(value, detail, 1);
            }
            //多选题
            if (isSelects && isSelects.length > 1) {
              getClassify(value, detail, 2);
            }
            //判断题
            if (isJude) {
              getClassify(value, detail, 3);
            }
            if (!isSelect && !isJude) {
              // console.log(value.join(" ").split("答案Answer:")[0], value.join(" ").split("答案Answer:")[0].match(fillReg),  value.join(" ").split("答案Answer:"), 'okk')
              // 填空题
              if (
                (value.join(" ").split("答案Answer:")[0].match(fillReg) &&
                  value.join(" ").split("答案Answer:").length > 1) ||
                (value.join(" ").split("答案:")[0].match(fillReg) &&
                  value.join(" ").split("答案:").length > 1) ||
                (value.join(" ").split("答案Answer：")[0].match(fillReg) &&
                  value.join(" ").split("答案Answer：").length > 1) ||
                (value.join(" ").split("答案：")[0].match(fillReg) &&
                  value.join(" ").split("答案：").length > 1) ||
                (/_+/.test(value.join(" ").split("答案Answer：")[0]) &&
                  value.join(" ").split("答案Answer：")[0].match(/_+/g).length >
                    0)
                // value.split("｜").length > 1
              ) {
                getClassify(value, detail, 4);
              } else {
                //问答题
                getClassify(value, detail, 5);
              }
            }
          } else {
            var newString = value.join(" ");
            if (/\s*[a-h][.|、]\s*/i.test(newString)) {
              //有选项情况下，默认为单选题
              getClassify(value, detail, 1);
            } else {
              //填空题筛选
              if (newString.split("答案")[0].match(fillReg)) {
                getClassify(value, detail, 4);
                false;
                continue;
              }
              //无选项情况下，默认为问答题（主要包括判断题与问答题的区分）
              getClassify(value, detail, 5);
            }
          }
        }
      }
    }
  }
  var html = "";
  //没有数据时隐藏检查处错误提示
  if (detail.length === 0) {
    $("#errorCount").text("");
    $("#errorText").hide();
    $("#nextError").hide();
  }
  var ii = -1; //计数
  for (const value of detail) {
    ii++;
    qt_type = value.type;
    html = markdown.toHTML(value.name.join(""));
    $("div#preview").append(html);

    // 标记答案
    markAnswer(qt_type, ii);
    changeSize(ii);
    //  错误点及时检测
    var errorNumber = $(".check_error").size();
    if (errorNumber > 0) {
      $("#errorCount").text(errorNumber);
      $("#errorText").show();
      if (errorNumber === 1) {
        $("#nextError").text("查看").show();
      } else {
        $("#nextError").text("下一处").show();
      }
    } else {
      $("#errorCount").text("");
      $("#errorText").hide();
      $("#nextError").hide();
    }
  }

  //禁止右侧多选点击，禁止默认事件
  $(".key input").click(function () {
    return false;
  });
}

//设置行号--需要引入auto-line-number-batch.js-暂没有引入
/**
 *
 */
export function setLineNumber() {
  // 行号
  return new setTextareaCount("#text-input", {
    width: "0",
    bgColor: "#edf2f7",
    color: "#989A9C",
    display: "inline-block",
  });
}

//切换试题难易程度
/**
 *
 * @param text
 */
export function changeDifficulity(text) {
  let errorChildren = $("#preview").children(".check_error");
  let errorChildrenDiff = $("#preview").children(".check_error_diff");
  for (let index = 0; index < $(errorChildren).length; index++) {
    if ($(errorChildren[index]).find(".qt_difficult").hasClass("qt_error")) {
      $(errorChildren[index]).addClass("new_error");
    }
  }
  for (let index = 0; index < $(errorChildrenDiff).length; index++) {
    if (
      $(errorChildrenDiff[index])
        .find(".qt_difficult")
        .hasClass("qt_error_diff")
    ) {
      $(errorChildrenDiff[index]).addClass("new_error");
    }
  }
  var newChildren = $("#preview").children(".new_error");
  for (const newChild of newChildren) {
    var diffBox = $(newChild).find(".qt_difficult");

    diffBox.removeClass("qt_error");
    diffBox.removeClass("qt_error_diff");
    if ($(newChild).find(".qt_error").length === 0) {
      $(newChild).removeClass("check_error");
    }
    if ($(newChild).find(".qt_error_diff").length === 0) {
      $(newChild).removeClass("check_error_diff");
    }
    $(diffBox).html(
      `<span class="title">${trans("global.difficultyLabelWithColon", "难度：")}</span>${text}`,
    );
  }

  //对所有单选题进行一次判断，如难度纠正后没有其他错误，放出'录入为多选题'选项 。取消纠正后，难度变为错误时，该选项隐藏
  $(".question[data-type=1]").each(function () {
    if ($(this).find(".qt_error").length > 0) {
      $(this).find(".change-type").hide();
    } else {
      $(this).find(".change-type").show();
    }
  });
}

//转义部分，换行 $markdown_return 进行两次替换
// 按照URL换码协议，＋会被转换成空格，所以要做相应处理
/**
 *
 * @param text
 */
function escapeHTML(text) {
  return text
    .replace(/^[\S\s]*<span class="title"[^>]*>[\S\s]+<\/span>([\S\s]*)$/, "$1")
    .replaceAll('<br class="markdown_return">', "$markdown_return")
    .replaceAll("&nbsp;", " ")
    .replaceAll("$markdown_return", '<br class="markdown_return">');
}

//组织导入试题信息
/**
 *
 */
export function serializeFn() {
  //试题分类
  var classification = 1; //???暂定
  var data = [];

  $("#preview")
    .find(".question")
    .each(function (index, element) {
      var type = $(this).attr("data-type");
      var reQuestion = $(this)
        .find(".qt_title")
        .html()
        .replace(
          /^[\S\s]*<span class="type-box"[^>]*>[\S\s]+<\/span>([\S\s]*)$/,
          "$1",
        );
      var question = escapeHTML(reQuestion);
      var answer1 =
        $(this).find(".key_A").length === 0
          ? ""
          : escapeHTML($(this).find(".key_A").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_A").html());
      var answer2 =
        $(this).find(".key_B").length === 0
          ? ""
          : escapeHTML($(this).find(".key_B").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_B").html());
      var answer3 =
        $(this).find(".key_C").length === 0
          ? ""
          : escapeHTML($(this).find(".key_C").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_C").html());
      var answer4 =
        $(this).find(".key_D").length === 0
          ? ""
          : escapeHTML($(this).find(".key_D").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_D").html());
      var answer5 =
        $(this).find(".key_E").length === 0
          ? ""
          : escapeHTML($(this).find(".key_E").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_E").html());
      var answer6 =
        $(this).find(".key_F").length === 0
          ? ""
          : escapeHTML($(this).find(".key_F").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_F").html());
      var answer7 =
        $(this).find(".key_G").length === 0
          ? ""
          : escapeHTML($(this).find(".key_G").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_G").html());
      var answer8 =
        $(this).find(".key_H").length === 0
          ? ""
          : escapeHTML($(this).find(".key_H").html()) == ""
            ? " "
            : escapeHTML($(this).find(".key_H").html());
      var key = null;
      if (type == "1" || type == "2") {
        key = escapeHTML($(this).find(".qt_answer").html())
          .replaceAll("&#58;", "")
          .toUpperCase()
          .replaceAll('<BR CLASS="MARKDOWN_RETURN">', "");
        key.replaceAll(/,|，/g, "");
        key.replaceAll(/:|：/g, "：");
        key && key.split("：")[1];
      } else if (type == "3") {
        console.log("ii");
        key = escapeHTML($(this).find(".qt_answer").html())
          .replaceAll(/(^\s+)|(\s+$)/g, "")
          .replace(/(正确|对|True)/, true)
          .replace(/(错误|错|False)/, false);
      } else if (type == "4") {
        key = null;
      } else {
        key = escapeHTML($(this).find(".qt_answer").html());
      }
      var completion = escapeHTML($(this).find(".qt_answer").html());
      // var order = completion.substring(completion.length - 4);
      // order = order.substring(1, 3) == "正序" ? true : false;
      completion = completion
        // .substring(0, completion.length - 4)
        .replaceAll("&amp;", "&");
      completion = completion.split("|");
      var comKeyWord =
        $(this).find(".qt_comKeyWord").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_comKeyWord").html());
      var coreKeyWord =
        $(this).find(".qt_coreKeyWord").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_coreKeyWord").html());
      var analysis =
        $(this).find(".qt_analysis").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_analysis").html());
      var difficult =
        $(this).find(".qt_difficult").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_difficult").html());
      var chapter =
        $(this).find(".qt_chapter").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_chapter").html());
      var knowledge =
        $(this).find(".qt_knowledge").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_knowledge").html());
      var indicator =
        $(this).find(".qt_indicator").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_indicator").html());
      // var difficult =
      //   $(this).find(".qt_order").length == 0
      //     ? ""
      //     : escapeHTML($(this).find(".qt_order").html());
      // if ($(this).find(".qt_difficult").length == 0) {
      //   message.info("难度不能为空");
      // }
      if ($(this).find(".qt_difficult").length > 0) {
        difficult = difficult
          .trim()
          .replace("Easy", "简单")
          .replace("Ordinary", "普通")
          .replace("Difficult", "困难")
          .slice(0, 2);
      }
      var label =
        $(this).find(".qt_label").length === 0
          ? ""
          : escapeHTML($(this).find(".qt_label").html());
      console.log(key, "hhh");
      data[index] = {
        type: type == 4 ? 3 : type && type == 3 ? 4 : type, //题目题型（1：单选题 2：多选题）
        questionLevelName: difficult, //题目难易文本
        questionLevel: getLevel(difficult), //题目难易程度
        content: question, //题干
        answer: key, //答案
        analysis: analysis, //解析
        chapter: chapter,
        knowledge: knowledge,
        indicator: indicator,
        gapFillingAnswer:
          type == 4
            ? {
                isOrder: false,
                answers: completion, //填空题答案
              }
            : null, //填空题答案
        optionList: handleData(
          answer1,
          answer2,
          answer3,
          answer4,
          answer5,
          answer6,
          answer7,
          answer8,
        ),
      };
      // data[index]={
      //     "classification":classification,
      //     "type":type,
      //     "difficult":difficult,
      //     "question":question,
      //     "answer1":answer1,
      //     "answer2":answer2,
      //     "answer3":answer3,
      //     "answer4":answer4,
      //     "answer5":answer5,
      //     "answer6":answer6,
      //     "answer7":answer7,
      //     "answer8":answer8,
      //     'normal_words':comKeyWord,
      //     "key_words":coreKeyWord,
      //     "key":key,
      //     "analysis":analysis,
      //     "label":label,
      //     "disorder":1
      // };
      // 若不存在该项则不存入
      for (let index_ in data[index]) {
        if (data[index][index_] == "" || !data[index][index_]) {
          delete data[index][index_];
        }
      }
    });

  return data;
}

/**
 *
 * @param difficultText
 */
function getLevel(difficultText) {
  let array = { 简单: 1, 普通: 2, 困难: 3 };
  return array[`${difficultText}`];
}

/**
 *
 * @param answer1
 * @param answer2
 * @param answer3
 * @param answer4
 * @param answer5
 * @param answer6
 * @param answer7
 * @param answer8
 */
function handleData(
  answer1,
  answer2,
  answer3,
  answer4,
  answer5,
  answer6,
  answer7,
  answer8,
) {
  let resultArray = [];
  var option = ["A", "B", "C", "D", "E", "F", "G", "H"];
  var array = [
    answer1,
    answer2,
    answer3,
    answer4,
    answer5,
    answer6,
    answer7,
    answer8,
  ];
  for (const [index, element] of array.entries()) {
    if (element) {
      var object = {};
      object.key = option[index];
      object.answers = `${option[index]}.${element}`;
      resultArray.push(object);
    }
  }
  return resultArray;
}
