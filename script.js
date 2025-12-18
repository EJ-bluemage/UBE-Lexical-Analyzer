/* ---------------------------
  Token definitions
   --------------------------- */
const TOKEN_MAP = {
  "+": "plus_op", "-": "sub_op", "*": "mul_op", "/": "div_op", "%": "mod_op",
  "=": "equal_sign", "==": "equality_op", "!=": "not_equal_op", "!": "not_operator", 
  "<": "lesser_than_op", ">": "greater_than_op", "<=": "lesser_than_or_eq_op", ">=": "greater_than_or_eq_op",
  "&&": "and_op", "||": "or_op",
  "++": "inc_op", "--": "dec_op",
  "+=": "plus_assign", "-=": "sub_assign",
  "*=": "mul_assign", "/=": "div_assign",
  ";": "semicolon", ",": "comma",
  ":": "colon", ".": "dot", "#": "hash",
  "?": "question_mark", "_": "underscore",
  "(": "left_paren", ")": "right_paren",
  "{": "left_brace", "}": "right_brace",
  "[": "left_bracket", "]": "right_bracket",
  "&": "bitwise_and", "|": "bitwise_or", "^": "bitwise_xor", "~": "bitwise_complement", "<<": "bitwise_left_shift", ">>": "bitwise_right_shift"
};
const KEYWORDS = new Set(["break", "case", "char", "const", "default", "do", "double", "else", "float", "for", "if", "int", "printf", "return", "scanf", "struct", "void", "while"]);
const RESERVED_WORDS = new Set(["attach", "bond", "cast", "continue", "detach", "main", "unbond"]);
const MULTI_OPS = ["==","!=","<=",">=","&&","||","++","--","+=","-=","*=","/=", "<<", ">>"];
const SINGLE_OPS = new Set(["+","-","*","/","%","=","<",">","!","&","|", "^", "~"]);
const PUNC = new Set(["(",")","{","}","[","]",";",",", ":",".","#", "?", "_"]);

function isAlpha(c){ return /[A-Za-z]/.test(c); }
function isDigit(c){ return /[0-9]/.test(c); }
function isAlphaNum(c){ return /[A-Za-z0-9_]/.test(c); }
function resolveTokenName(type, lexeme){
  if(type === "Operator" || type === "Punctuation"){
    return TOKEN_MAP[lexeme] || type;
  }
  return type;
}

/* ---------------------------
  LEXER
   --------------------------- */
function lex(code){
  const tokens = [];
  let i = 0, line = 1;

  while(i < code.length){
    let c = code[i];
    let startLine = line;

    if(c === "\n"){ i++; line++; continue; }
    if(/[ \t]/.test(c)){ i++; continue; }

    if(c === "/" && code[i+1] === "/"){
      let j = i+2;
      while(j < code.length && code[j] !== "\n") j++;
      tokens.push({ token:"Comment", lexeme:code.slice(i,j), line:startLine });
      i=j; continue;
    }

    if (c === "/" && code[i+1] === "*") {
      let j = i + 2;
      let closed = false;

    while (j < code.length) {
      if (code[j] === "\n") line++;
      if (code[j - 1] === "*" && code[j] === "/") {
        closed = true;
        j++;
        break;
      }
      j++;
    }

    if (!closed) {
      tokens.push({
        token: "LEXICAL_ERROR",
        lexeme: code.slice(i),
        line: startLine
      });
      break;
    }

    tokens.push({
      token: "Comment",
      lexeme: code.slice(i, j),
      line: startLine
    });

    i = j;
    continue;
  }

    if (c === '"') {
      let j = i + 1;
      let closed = false;

    while (j < code.length) {
      if (code[j] === "\n") line++;
      if (code[j] === '"') {
        closed = true;
        j++;
        break;
      }
      j++;
    }

    if (!closed) {
      tokens.push({
        token: "LEXICAL_ERROR",
        lexeme: code.slice(i),
        line: startLine
      });
      break;
    }

    tokens.push({
      token: "String_literal",
      lexeme: code.slice(i, j),
      line: startLine
    });

    i = j;
    continue;
  }

    if(isDigit(c)){
      let j=i;
      while(j<code.length && isDigit(code[j])) j++;
      tokens.push({ token:"Int_literal", lexeme:code.slice(i,j), line:startLine });
      i=j; continue;
    }

    if (isAlpha(c)) {
      let j = i;
      while (j < code.length && isAlphaNum(code[j])) j++;
      let text = code.slice(i, j);

      let type = "Identifier";
      if (KEYWORDS.has(text)) {
        type = "Keyword";
      } else if (RESERVED_WORDS.has(text)) {
        type = "Reserved_Word";
      }

      tokens.push({
        token: type,
        lexeme: text,
        line: startLine
      });

      i = j;
      continue;
    }

    let m = MULTI_OPS.find(op => code.startsWith(op,i));
    if(m){
      tokens.push({ token:"Operator", lexeme:m, line:startLine });
      i+=m.length; continue;
    }

    if(SINGLE_OPS.has(c)){
      tokens.push({ token:"Operator", lexeme:c, line:startLine });
      i++; continue;
    }

    if(PUNC.has(c)){
      tokens.push({ token:"Punctuation", lexeme:c, line:startLine });
      i++; continue;
    }

    tokens.push({ token:"Unknown", lexeme:c, line:startLine });
    i++;
  }

  return tokens;
}

/* ---------------------------
  UI ACTIONS
   --------------------------- */
function analyze(){
  const code = document.getElementById("code").value;
  const tokens = lex(code);

  const tbody = document.querySelector("#tokenTable tbody");
  tbody.innerHTML = "";

  tokens.forEach((t, i) => {
  const isError = t.token === "LEXICAL_ERROR";

  tbody.innerHTML += `
    <tr class="${isError ? "error-row" : ""}">
      <td>${i + 1}</td>
      <td>${t.lexeme.replace(/</g,"&lt;")}</td>
      <td>${resolveTokenName(t.token, t.lexeme)}</td>
      <td>${t.line}</td>
    </tr>`;
});
}

function insertSample(){
  const sample = `printf("Welcome to UBE\\n");`;
  document.getElementById("code").value = sample;
  updateLineNumbers();
  // ensure gutter is scrolled to top
  document.getElementById("lineNumbers").scrollTop = 0;
  document.getElementById("code").scrollTop = 0;
}

function clearAll(){
  document.getElementById("code").value = "";
  document.querySelector("#tokenTable tbody").innerHTML = "";
  updateLineNumbers();
}

function downloadCSV() {
  let filename = prompt("Enter filename (without extension):", "ube_tokens");
  if (!filename || filename.trim() === "") filename = "ube_tokens";
  filename = filename.trim() + ".csv";

  const rows = [...document.querySelectorAll("#tokenTable tr")]
    .map(tr => [...tr.children].map(td => '"' + td.innerText + '"').join(','));

  const blob = new Blob([ rows.join("\n") ], { type:"text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ---------------------------
  LINE NUMBER SYSTEM
   --------------------------- */
function updateLineNumbers(){
  const code = document.getElementById("code");
  const lineNumbers = document.getElementById("lineNumbers");

  const count = Math.max(1, code.value.split("\n").length);
  lineNumbers.textContent = Array.from({length:count}, (_,i)=>i+1).join("\n");

  lineNumbers.style.height = code.clientHeight + "px";
}

function syncScroll(){
  const code = document.getElementById("code");
  const lineNumbers = document.getElementById("lineNumbers");
  lineNumbers.scrollTop = code.scrollTop;
}

document.addEventListener("DOMContentLoaded", () => {
  updateLineNumbers();
  window.addEventListener("resize", updateLineNumbers);
});
