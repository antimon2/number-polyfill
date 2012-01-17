uu.ready(function(uu){
  var isNumberTypeAvailable = uu.input("type:number").type === "number";
  if (!isNumberTypeAvailable) {
    var getParams = function(elem) {
      var step = uu(elem).attr('step');
      step = /^-?\d+(?:\.\d+)?$/.test(step) ? parseFloat(step) : undefined;
      var min = uu(elem).attr('min');
      min = /^-?\d+(?:\.\d+)?$/.test(min) ? parseFloat(min) : undefined;
      var max = uu(elem).attr('max');
      max = /^-?\d+(?:\.\d+)?$/.test(max) ? parseFloat(max) : undefined;

      var value = parseFloat(uu(elem).value()) || (min || 0);

      return {
        min: min,
        max: max,
        step: step,
        value: value
      };
    };

    var clipValues = function(value, min, max) {
      if (max !== undefined && value > max) {
        return max;
      } else if (min !== undefined && value < min) {
        return min;
      } else {
        return value;
      }
    };
    
    var extractNumDecimalDigits = function(input) {
      if (input !== undefined) {
        var num = 0;
        var raisedNum = input;
        while (raisedNum != Math.round(raisedNum)) {
          num += 1;
          raisedNum = input * Math.pow(10, num);
        }
        return num;
      } else {
        return 0;
      }
    }

    var matchStep = function(value, min, max, step) {
      var stepDecimalDigits = extractNumDecimalDigits(step);
      if (step === undefined) {
        return value;
      } else if (stepDecimalDigits == 0) {
        var mod = (value - (min || 0)) % step;
        if (mod == 0) {
          return value;
        } else {
          var stepDown = value - mod;
          var stepUp = stepDown + step;
          if ((stepUp > max) || ((value - stepDown) < (stepUp - value))) {
            return stepDown;
          } else {
            return stepUp;
          }
        }
      } else {
        var raiseTo = Math.pow(10, stepDecimalDigits);
        var raisedStep = step * raiseTo;
        var raisedMod = (value - (min || 0)) * raiseTo % raisedStep;
        if (raisedMod == 0) {
          return value;
        } else {
          var raisedValue = (value * raiseTo);
          var raisedStepDown = raisedValue - raisedMod;
          var raisedStepUp = raisedStepDown + raisedStep;
          if (((raisedStepUp / raiseTo) > max) || ((raisedValue - raisedStepDown) < (raisedStepUp - raisedValue))) {
            return (raisedStepDown / raiseTo);
          } else {
            return (raisedStepUp / raiseTo);
          }
        }
      }
    };

    var increment = function(elem) {
      var params = getParams(elem);
      var raiseTo = Math.pow(10, Math.max(extractNumDecimalDigits(params['value']), extractNumDecimalDigits(params['step'])));
      var newVal = (Math.round(params['value'] * raiseTo) + Math.round((params['step'] || 1) * raiseTo)) / raiseTo;

      if (params['max'] !== undefined && newVal > params['max']) newVal = params['max'];
      if (params['min'] !== undefined && newVal < params['min']) newVal = params['min'];
      newVal = matchStep(newVal, params['min'], params['max'], params['step']);

      uu(elem).value("" + newVal);
    };
    
    var decrement = function(elem, amt) {
      var params = getParams(elem);
      var raiseTo = Math.pow(10, Math.max(extractNumDecimalDigits(params['value']), extractNumDecimalDigits(params['step'])));
      var newVal = (Math.round(params['value'] * raiseTo) - Math.round((params['step'] || 1) * raiseTo)) / raiseTo;

      if (params['min'] !== undefined && newVal < params['min']) newVal = params['min'];
      if (params['max'] !== undefined && newVal > params['max']) newVal = params['max'];
      newVal = matchStep(newVal, params['min'], params['max'], params['step']);

      uu(elem).value("" + newVal);
    };

    uu('input[type="number"]').each(function(elem, index) {
      var halfHeight = uu.css.rect(elem).h / 2;
      var upBtn = uu.div(
        {"class": "number-spin-btn number-spin-btn-up"},
        {"height": halfHeight}
      );
      var downBtn = uu.div(
        {"class": "number-spin-btn number-spin-btn-down"},
        {"height": halfHeight}
      );
      var btnContainer = uu.div(
        {"class": "number-spin-btn-container"},
        upBtn,
        downBtn
      );
      uu(elem).add(btnContainer, 'next');

      var orgVal = elem.value;
      uu(elem).bind(
        "mousewheel", function(event) {
          if (event.uu.wheel < 0) {
            increment(event.node);
          } else {
            decrement(event.node);
          }
          uu.event.fire(elem, "input");
          orgVal = event.node.value;
          event.preventDefault();
        }
      ).bind(
        "keydown", function(event) {
          if (event.keyCode == 38) { // up arrow
            increment(event.node);
            uu.event.fire(elem, "input");
            orgVal = event.node.value;
          } else if (event.keyCode == 40) { // down arrow
            decrement(event.node);
            uu.event.fire(elem, "input");
            orgVal = event.node.value;
          }
        }
      ).bind(
        "input", function(event) {
          var val = event.node.value;
          if (val !== "" && !/^-?\d*(?:\.\d*)?$/.test(val)) {
            event.node.value = orgVal;
            return;
          }
          orgVal = val;
        }
      ).bind(
        "change", function(event) {
          if (event.node.value !== "") {
            var params = getParams(event.node);
            var newVal = clipValues(params['value'], params['min'], params['max']);
            newVal = matchStep(newVal, params['min'], params['max'], params['step'], params['stepDecimal']);

            uu(event.node).value("" + newVal);
          }
          orgVal = event.node.value;
        }
      );
      uu(upBtn).bind(
        "mousedown", function(event) {
          increment(elem);
          uu.event.fire(elem, "input");
          orgVal = elem.value;
          
          var timeoutFunc = function(elem, incFunc) {
            incFunc(elem);
            orgVal = elem.value;

            elem.timeoutID = window.setTimeout(timeoutFunc, 10, elem, incFunc);
          };
          
          var releaseFunc = function(event) {
            uu.event.fire(elem, "input");
            window.clearTimeout(elem.timeoutID);
            uu(document).unbind('mouseup', releaseFunc);
            uu(upBtn).unbind('mouseleave', releaseFunc);
          };

          uu(document).bind('mouseup', releaseFunc);
          uu(upBtn).bind('mouseleave', releaseFunc);
          
          elem.timeoutID = window.setTimeout(timeoutFunc, 700, elem, increment);
        }
      );
      uu(downBtn).bind(
        "mousedown", function(event) {
          decrement(elem);
          uu.event.fire(elem, "input");
          orgVal = elem.value;
          
          var timeoutFunc = function(elem, decFunc) {
            decFunc(elem);
            orgVal = elem.value;

            elem.timeoutID = window.setTimeout(timeoutFunc, 10, elem, decFunc);
          };
          
          var releaseFunc = function(event) {
            uu.event.fire(elem, "input");
            window.clearTimeout(elem.timeoutID);
            uu(document).unbind('mouseup', releaseFunc);
            uu(downBtn).unbind('mouseleave', releaseFunc);
          };

          uu(document).bind('mouseup', releaseFunc);
          uu(downBtn).bind('mouseleave', releaseFunc);
          
          elem.timeoutID = window.setTimeout(timeoutFunc, 700, elem, decrement);
        }
      );
      uu(elem).css('text-align', 'right');
    });
  }
});
