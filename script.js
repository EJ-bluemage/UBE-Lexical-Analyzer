/* ---------------------------
  Token definitions (kept as before)
   --------------------------- */
const TOKEN_MAP = {
  "+": "plus_op", "-": "sub_op", "*": "mul_op", "/": "div_op", "%": "mod_op",
  "=": "equal_sign", "==": "equality_op", "!=": "neq_op",
  "<": "lesser_than_op", ">": "greater_than_op", "<=": "lesser_than_or_eq_op", ">=": "greater_than_or_eq_op",
  "&&": "and_op", "||": "or_op",
  "++": "inc_op", "--": "dec_op",
  "+=": "plus_assign", "-=": "sub_assign",
  "*=": "mul_assign", "/=": "div_assign",
  ";": "semicolon", ",": "comma",
  "(": "left_paren", ")": "right_paren",
  "{": "left_brace", "}": "right_brace",
  "[": "left_bracket", "]": "right_bracket"
};
const KEYWORDS = new Set(["int","float","char","double","void","return","if","else","while","for","struct","bond", "unbond", "attach", "detach"]);
const MULTI_OPS = ["==","!=","<=",">=","&&","||","++","--","+=","-=","*=","/="];
const SINGLE_OPS = new Set(["+","-","*","/","%","=","<",">","!","&","|"]);
const PUNC = new Set(["(",")","{","}","[","]",";",","]);

function isAlpha(c){ return /[A-Za-z_]/.test(c); }
function isDigit(c){ return /[0-9]/.test(c); }
function isAlphaNum(c){ return /[A-Za-z0-9_]/.test(c); }
function resolveTokenName(type, lexeme){
  if(type === "Operator" || type === "Punctuation"){
    return TOKEN_MAP[lexeme] || type;
  }
  return type;
}

/* ---------------------------
  LEXER (unchanged)
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

    if(c === "/" && code[i+1] === "*"){
      let j=i+2;
      while(j<code.length && !(code[j-1]=="*" && code[j]=="/")) j++;
      j++;
      tokens.push({ token:"Comment", lexeme:code.slice(i,j), line:startLine });
      i=j; continue;
    }

    if(c === '"'){
      let j=i+1;
      while(j<code.length && code[j] !== '"') j++;
      j++;
      tokens.push({ token:"String", lexeme:code.slice(i,j), line:startLine });
      i=j; continue;
    }

    if(isDigit(c)){
      let j=i;
      while(j<code.length && isDigit(code[j])) j++;
      tokens.push({ token:"int_literal", lexeme:code.slice(i,j), line:startLine });
      i=j; continue;
    }

    if(isAlpha(c)){
      let j=i;
      while(j<code.length && isAlphaNum(code[j])) j++;
      let text = code.slice(i,j);
      tokens.push({
        token: KEYWORDS.has(text) ? "Keyword" : "Identifier",
        lexeme:text,
        line:startLine
      });
      i=j; continue;
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
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${t.lexeme.replace(/</g,"&lt;")}</td>
        <td>${resolveTokenName(t.token, t.lexeme)}</td>
        <td>${t.line}</td>
      </tr>`;
  });
}

function insertSample(){
  const sample = `#include <stdio.h>

int main() {
    printf("Welcome to UBE\\n");
    int a = 10;
    if (a > 5) {
        a += 2;
    }
    return 0;
}`;
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
  LINE NUMBER SYSTEM (fixed)
  - Ensure same box-sizing, font-size, line-height, padding between gutter and textarea.
  - Keep a fixed pixel line-height and update gutter content on input.
  - Keep both scrollTop in sync.
   --------------------------- */
function updateLineNumbers(){
  const code = document.getElementById("code");
  const lineNumbers = document.getElementById("lineNumbers");

  // create line count
  const count = Math.max(1, code.value.split("\n").length);
  lineNumbers.textContent = Array.from({length:count}, (_,i)=>i+1).join("\n");

  // ensure the gutter height matches the textarea inner height (so lines align across resize)
  // textarea.clientHeight excludes its borders; lineNumbers is box-sizing:border-box so set its height to match
  lineNumbers.style.height = code.clientHeight + "px";
}

function syncScroll(){
  const code = document.getElementById("code");
  const lineNumbers = document.getElementById("lineNumbers");
  // sync vertical scrolling
  lineNumbers.scrollTop = code.scrollTop;
}

/* initialize line numbers on page load */
document.addEventListener("DOMContentLoaded", () => {
  // set a sample small placeholder so updateLineNumbers picks up correct heights
  updateLineNumbers();

  // if window resized, recalc gutter height so lines keep aligned
  window.addEventListener("resize", updateLineNumbers);

  // also recalc if fonts change (rare) - using a small interval debounce could be added but this is enough
});