/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/no-this-alias */
/**
 * URL Template v3.2.7 (https://github.com/bramstein/url-template)
 */

export class UrlTemplate {
  encodeReserved(str: string): string {
    return str
      .split(/(%[0-9A-Fa-f]{2})/g)
      .map(function(part) {
        if (!/%[0-9A-Fa-f]/.test(part)) {
          part = encodeURI(part)
            .replace(/%5B/g, '[')
            .replace(/%5D/g, ']');
        }
        return part;
      })
      .join('');
  }
  encodeUnreserved(str: string): string {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
      return (
        '%' +
        c
          .charCodeAt(0)
          .toString(16)
          .toUpperCase()
      );
    });
  }
  encodeValue(operator: string, value: string, key?: string): string {
    value = operator === '+' || operator === '#' ? this.encodeReserved(value) : this.encodeUnreserved(value);

    if (key) {
      return this.encodeUnreserved(key) + '=' + value;
    } else {
      return value;
    }
  }
  isDefined(value: any): boolean {
    return value !== undefined && value !== null;
  }
  isKeyOperator(operator: string): boolean {
    return operator === ';' || operator === '&' || operator === '?';
  }
  getValues(context: any, operator: string, key: string, modifier: string): any {
    let value = context[key],
      result = [];

    if (this.isDefined(value) && value !== '') {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        value = value.toString();

        if (modifier && modifier !== '*') {
          value = value.substring(0, parseInt(modifier, 10));
        }

        result.push(this.encodeValue(operator, value, this.isKeyOperator(operator) ? key : null));
      } else {
        if (modifier === '*') {
          if (Array.isArray(value)) {
            value.filter(this.isDefined).forEach((val) => {
              result.push(this.encodeValue(operator, val, this.isKeyOperator(operator) ? key : null));
            }, this);
          } else {
            Object.keys(value).forEach((k) => {
              if (this.isDefined(value[k])) {
                result.push(this.encodeValue(operator, value[k], k));
              }
            }, this);
          }
        } else {
          let tmp: any = [];

          if (Array.isArray(value)) {
            value.filter(this.isDefined).forEach((val) => {
              tmp.push(this.encodeValue(operator, val));
            }, this);
          } else {
            Object.keys(value).forEach((k) => {
              if (this.isDefined(value[k])) {
                tmp.push(this.encodeUnreserved(k));
                tmp.push(this.encodeValue(operator, value[k].toString()));
              }
            }, this);
          }

          if (this.isKeyOperator(operator)) {
            result.push(this.encodeUnreserved(key) + '=' + tmp.join(','));
          } else if (tmp.length !== 0) {
            result.push(tmp.join(','));
          }
        }
      }
    } else {
      if (operator === ';') {
        if (this.isDefined(value)) {
          result.push(this.encodeUnreserved(key));
        }
      } else if (value === '' && (operator === '&' || operator === '?')) {
        result.push(this.encodeUnreserved(key) + '=');
      } else if (value === '') {
        result.push('');
      }
    }
    return result;
  }
  parse(template: string): any {
    let that = this;
    let operators = ['+', '#', '.', '/', ';', '?', '&'];
    let variables: any = [];

    return {
      vars: variables,
      expand: function(context: any) {
        return template.replace(/\{([^{}]+)\}|([^{}]+)/g, function(_, expression, literal) {
          if (expression) {
            let operator: any = null,
              values: any = [];

            if (operators.indexOf(expression.charAt(0)) !== -1) {
              operator = expression.charAt(0);
              expression = expression.substr(1);
            }

            expression.split(/,/g).forEach(function(variable: any) {
              let tmp = /([^:*]*)(?::(\d+)|(\*))?/.exec(variable);
              values.push.apply(values, that.getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
              variables.push(tmp[1]);
            });

            if (operator && operator !== '+') {
              let separator = ',';

              if (operator === '?') {
                separator = '&';
              } else if (operator !== '#') {
                separator = operator;
              }
              return (values.length !== 0 ? operator : '') + values.join(separator);
            } else {
              return values.join(',');
            }
          } else {
            return that.encodeReserved(literal);
          }
        });
      }
    };
  }
}

export default new UrlTemplate();
