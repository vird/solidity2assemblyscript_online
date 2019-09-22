// Generated by IcedCoffeeScript 108.0.11
(function() {
  var Type, gen, mod_ast, module, translate_type, type2default_value;

  ;

  Type = window.Type;

  mod_ast = window.mod_ast;

  module = this;

  translate_type = function(type) {
    if (type.is_user_defined) {
      return type.main;
    }
    switch (type.main) {
      case 'bool':
        return 'bool';
      case 'uint':
        return 'u64';
      case 'int':
        return 'i64';
      case 'address':
        return 'String';
      case 'map':
        return "HashMap<" + (translate_type(type.nest_list[0])) + "," + (translate_type(type.nest_list[1])) + ">";
      default:

        /* !pragma coverage-skip-block */
        pp(type);
        throw new Error("unknown solidity type '" + type + "'");
    }
  };

  type2default_value = function(type) {
    switch (type.toString()) {
      case 'bool':
        return 'False';
      case 'uint':
        return '0';
      case 'int':
        return '0';
      case 'address':
        return '"".to_string()';
      default:
        throw new Error("unknown solidity type '" + type + "'");
    }
  };

  this.bin_op_name_map = {
    ADD: '+',
    SUB: '-',
    MUL: '*',
    DIV: '/',
    MOD: '%',
    EQ: '==',
    NE: '!=',
    GT: '>',
    LT: '<',
    GTE: '>=',
    LTE: '<=',
    BIT_AND: '&',
    BIT_OR: '|',
    BIT_XOR: '^',
    BOOL_AND: '&&',
    BOOL_OR: '||'
  };

  this.bin_op_name_cb_map = {
    ASSIGN: function(a, b) {
      return "" + a + " = " + b;
    },
    ASS_ADD: function(a, b) {
      return "" + a + " += " + b;
    },
    ASS_SUB: function(a, b) {
      return "" + a + " -= " + b;
    },
    ASS_MUL: function(a, b) {
      return "" + a + " *= " + b;
    },
    ASS_DIV: function(a, b) {
      return "" + a + " /= " + b;
    },
    INDEX_ACCESS: function(a, b, ctx, ast) {
      return "" + a + ".get(" + b + ").or_else(" + (type2default_value(ast.type)) + ")";
    }
  };

  this.un_op_name_cb_map = {
    MINUS: function(a) {
      return "-(" + a + ")";
    },
    BOOL_NOT: function(a) {
      return "!(" + a + ")";
    },
    BIT_NOT: function(a) {
      return "~(" + a + ")";
    },
    BRACKET: function(a) {
      return "(" + a + ")";
    },
    PRE_INCR: function(a) {
      return "" + a + "+=1";
    },
    POST_INCR: function(a) {
      p("NOTE please look at " + a + "+=1 it was translated from postfix increment");
      return "" + a + "+=1";
    },
    PRE_DECR: function(a) {
      return "" + a + "-=1";
    },
    POST_DECR: function(a) {
      p("NOTE please look at " + a + "-=1 it was translated from postfix decrement");
      return "" + a + "-=1";
    }
  };

  this.Gen_context = (function() {
    Gen_context.prototype.parent = null;

    Gen_context.prototype.is_contract = false;

    Gen_context.prototype.is_struct = false;

    Gen_context.prototype.var_hash = {};

    Gen_context.prototype.continue_append = '';

    function Gen_context() {
      this.var_hash = {};
    }

    Gen_context.prototype.mk_nest = function() {
      var t;
      t = new module.Gen_context;
      t.parent = this;
      return t;
    };

    Gen_context.prototype.is_contract_var = function(name) {
      if (this.is_contract && this.var_hash[name]) {
        return true;
      }
      if (this.parent) {
        return this.parent.is_contract_var(name);
      }
      return false;
    };

    return Gen_context;

  })();

  this.boilerplate = "#![feature(const_vec_new)]\nuse borsh::{BorshDeserialize, BorshSerialize};\nuse near_bindgen::{env, near_bindgen};\nuse serde_json::json;\n\n#[global_allocator]\nstatic ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;";

  this.gen = function(ast, opt) {
    var ctx, ret;
    if (opt == null) {
      opt = {};
    }
    ctx = new module.Gen_context;
    ret = module._gen(ast, opt, ctx);
    return "" + module.boilerplate + "\n\n" + ret;
  };

  this._gen = gen = function(ast, opt, ctx) {
    var arg_jl, arg_list, aux_export, aux_incr, aux_init, aux_struct_decl, body, cb, cond, ctx_lvalue, ctx_orig, f, fn, fn_decl_jl, idx, incr, init, is_a_index_access, is_assign, jl, name, o_type, op, pre, res, ret, scope, struct_decl_jl, synth_b, t, type, v, val, var_decl_jl, _a, _a_col, _a_key, _b, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _synth_b;
    switch (ast.constructor.name) {
      case "Var":
        name = ast.name;
        if (ctx.is_contract_var(name)) {
          return "self." + name;
        }
        return name;
      case "Const":
        switch (ast.type.main) {
          case 'string':
            return JSON.stringify(ast.val) + ".to_string()";
          default:
            return ast.val;
        }
        break;
      case 'Bin_op':
        ctx_lvalue = ctx.mk_nest();
        is_assign = 0 === ast.op.indexOf('ASS');
        is_a_index_access = ast.a.constructor.name === 'Bin_op' && ast.a.op === 'INDEX_ACCESS';
        if (is_assign && is_a_index_access && ast.a.a.type.main === 'map') {
          _a_col = gen(ast.a.a, opt, ctx_lvalue);
          _a_key = gen(ast.a.b, opt, ctx_lvalue);
          if (ast.op === 'ASSIGN') {
            _b = gen(ast.b, opt, ctx);
            return "" + _a_col + ".insert(" + _a_key + ", " + _b + ")";
          } else {
            _a = gen(ast.a, opt, ctx_lvalue);
            synth_b = new mod_ast.Bin_op;
            synth_b.op = ast.op.replace('ASS_', '');
            synth_b.a = ast.a;
            synth_b.b = ast.b;
            synth_b.type = ast.a.type;
            _synth_b = gen(synth_b, opt, ctx);
            return "" + _a_col + ".insert(" + _a_key + ", " + _synth_b + ")";
          }
        }
        _a = gen(ast.a, opt, ctx_lvalue);
        _b = gen(ast.b, opt, ctx);
        if (op = module.bin_op_name_map[ast.op]) {
          return "(" + _a + " " + op + " " + _b + ")";
        } else if (cb = module.bin_op_name_cb_map[ast.op]) {
          return cb(_a, _b, ctx, ast);
        } else {

          /* !pragma coverage-skip-block */
          throw new Error("Unknown/unimplemented bin_op " + ast.op);
        }
        break;
      case "Un_op":
        if (cb = module.un_op_name_cb_map[ast.op]) {
          return cb(gen(ast.a, opt, ctx), ctx);
        } else {

          /* !pragma coverage-skip-block */
          throw new Error("Unknown/unimplemented un_op " + ast.op);
        }
        break;
      case "Field_access":
        t = gen(ast.t, opt, ctx);
        ret = "" + t + "." + ast.name;
        return ret;
      case "Fn_call":
        fn = gen(ast.fn, opt, ctx);
        arg_list = [];
        _ref = ast.arg_list;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          v = _ref[_i];
          arg_list.push(gen(v, opt, ctx));
        }
        return "" + fn + "(" + (arg_list.join(', ')) + ")";
      case "Scope":
        jl = [];
        _ref1 = ast.list;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          v = _ref1[_j];
          val = gen(v, opt, ctx);
          if (val[val.length - 1] !== ';') {
            val += ';';
          }
          jl.push(val);
        }
        return join_list(jl, '');
      case "Var_decl":
        ctx.var_hash[ast.name] = ast.type;
        type = translate_type(ast.type);
        if (ctx.is_struct) {
          pre = "" + ast.name + ":" + type;
        } else {
          pre = "let mut " + ast.name + ":" + type;
        }
        if (ast.assign_value) {
          val = gen(ast.assign_value, opt, ctx);
          return "" + pre + " = " + val;
        } else {
          return pre;
        }
        break;
      case "Ret_multi":
        if (ast.t_list.length > 1) {
          throw new Error("not implemented ast.t_list.length > 1");
        }
        jl = [];
        _ref2 = ast.t_list;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          v = _ref2[_k];
          jl.push(gen(v, opt, ctx));
        }
        return "return " + (jl.join(', '));
      case "If":
        cond = gen(ast.cond, opt, ctx);
        t = gen(ast.t, opt, ctx);
        f = gen(ast.f, opt, ctx);
        return "if " + cond + " {\n  " + (make_tab(t, '  ')) + "\n} else {\n  " + (make_tab(f, '  ')) + "\n}";
      case "While":
        cond = gen(ast.cond, opt, ctx);
        scope = gen(ast.scope, opt, ctx);
        return "while " + cond + " {\n  " + (make_tab(scope, '  ')) + "\n} ";
      case "For_3pos":
        init = ast.init ? gen(ast.init, opt, ctx) : "";
        cond = gen(ast.cond, opt, ctx);
        incr = ast.incr ? gen(ast.incr, opt, ctx) : "";
        ctx = ctx.mk_nest();
        ctx.continue_append = incr;
        scope = gen(ast.scope, opt, ctx);
        aux_init = "";
        if (init) {
          aux_init = "" + init + ";\n";
        }
        aux_incr = "";
        if (incr) {
          aux_incr = "\n  " + incr + ";";
        }
        return "" + aux_init + "while " + cond + " {\n  " + (make_tab(scope, '  ')) + aux_incr + "\n}";
      case "Continue":
        if (ctx.continue_append) {
          return "" + ctx.continue_append + ";\ncontinue";
        } else {
          return "continue";
        }
        break;
      case "Break":
        return "break";
      case "Class_decl":
        ctx = ctx.mk_nest();
        if (ast.is_struct) {
          ctx.is_struct = true;
        } else {
          ctx.is_contract = true;
        }
        struct_decl_jl = [];
        var_decl_jl = [];
        fn_decl_jl = [];
        _ref3 = ast.scope.list;
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          v = _ref3[_l];
          switch (v.constructor.name) {
            case 'Class_decl':
              struct_decl_jl.push(gen(v, opt, ctx));
              break;
            case 'Var_decl':
              res = gen(v, opt, ctx);
              res += ";";
              var_decl_jl.push(res);
              break;
            case 'Fn_decl_multiret':
              fn_decl_jl.push(gen(v, opt, ctx));
              break;
            default:
              p(v);
              throw new Error("unknown v.constructor.name = " + v.constructor.name);
          }
        }
        if (ast.is_struct) {
          if (fn_decl_jl.length) {

            /* !pragma coverage-skip-block */
            throw new Error("fn decl inside struct");
          }
          if (struct_decl_jl.length) {

            /* !pragma coverage-skip-block */
            throw new Error("struct decl inside struct");
          }
          return "#[near_bindgen]\n#[derive(Default, BorshDeserialize, BorshSerialize)]\npub struct " + ast.name + " {\n  " + (join_list(var_decl_jl, "  ")) + "\n}\n";
        } else {
          aux_struct_decl = "";
          if (struct_decl_jl.length) {
            aux_struct_decl = "" + (join_list(struct_decl_jl, '')) + "\n\n";
          }
          return "" + aux_struct_decl + "#[near_bindgen]\n#[derive(Default, BorshDeserialize, BorshSerialize)]\npub struct " + ast.name + " {\n  " + (join_list(var_decl_jl, '  ')) + "\n}\n#[near_bindgen]\nimpl " + ast.name + " {\n  " + (join_list(fn_decl_jl, "  ")) + "\n}\n";
        }
        break;
      case "Fn_decl_multiret":
        ctx_orig = ctx;
        ctx = ctx.mk_nest();
        arg_jl = [];
        arg_jl.push("&mut self");
        _ref4 = ast.arg_name_list;
        for (idx = _m = 0, _len4 = _ref4.length; _m < _len4; idx = ++_m) {
          v = _ref4[idx];
          arg_jl.push("" + v + ":" + (translate_type(ast.type_i.nest_list[idx])));
        }
        body = gen(ast.scope, opt, ctx);
        if (ast.type_o.nest_list.length) {
          o_type = translate_type(ast.type_o.nest_list[0]);
        } else {
          o_type = "void";
        }
        aux_export = "";
        if (ast.visibility === 'public') {
          aux_export = "pub ";
        }
        return "" + aux_export + "fn " + ast.name + "(" + (arg_jl.join(', ')) + "):" + o_type + " {\n  " + (make_tab(body, '  ')) + "\n}";
      default:
        if (opt.next_gen != null) {
          return opt.next_gen(ast, opt, ctx);
        }

        /* !pragma coverage-skip-block */
        perr(ast);
        throw new Error("unknown ast.constructor.name=" + ast.constructor.name);
    }
  };

}).call(window.translate = {})
