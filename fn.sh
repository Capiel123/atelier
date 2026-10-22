#!/bin/sh
# Uso: ./fn.sh nomeDaFuncao   -> imprime só aquela função do app.js (cole no chat no lugar do arquivo inteiro)
awk -v n="$1" '$0 ~ "^(async )?function "n"\\(" {p=1;s=NR} p{print; if((NR==s && /\{/ && /\}[ \t]*$/) || (NR>s && /^\}/)) exit}' app.js
