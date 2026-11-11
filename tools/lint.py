"""Revisa que un programa use SOLO los temas permitidos del curso."""
import ast

METODOS = {
    # conjuntos
    "add", "remove", "discard", "pop", "issubset", "issuperset", "union", "difference",
    # cadenas
    "split", "join", "replace", "find", "index", "lower", "upper", "title", "capitalize",
    "strip", "count", "isdigit", "isalpha", "isalnum", "isspace", "islower", "isupper",
}
FUNCIONES = {"print", "len", "range", "int", "float", "str", "bool", "tuple", "set", "bin"}
PROHIBIDOS = {
    ast.ListComp: "list comprehension", ast.SetComp: "set comprehension", ast.DictComp: "dict comprehension",
    ast.GeneratorExp: "generador", ast.Dict: "diccionario", ast.Lambda: "lambda", ast.Try: "try/except",
    ast.ClassDef: "clase", ast.Import: "import", ast.ImportFrom: "import", ast.Match: "match-case",
    ast.Break: "break", ast.Continue: "continue", ast.IfExp: "if en una linea", ast.JoinedStr: "f-string",
    ast.Slice: "slicing", ast.With: "with", ast.Global: "global", ast.Nonlocal: "nonlocal",
    ast.Starred: "*", ast.NamedExpr: ":=", ast.Delete: "del", ast.Assert: "assert", ast.Raise: "raise",
    ast.Yield: "yield", ast.AsyncFunctionDef: "async",
}
BINOPS = (ast.Add, ast.Sub, ast.Mult, ast.Pow, ast.Div, ast.FloorDiv, ast.Mod)
AUGOPS = (ast.Add, ast.Sub, ast.Div)  # += -= /=
CMPOPS = (ast.Eq, ast.NotEq, ast.Gt, ast.Lt, ast.GtE, ast.LtE)


def revisar(codigo):
    problemas = []
    try:
        arbol = ast.parse(codigo)
    except SyntaxError as e:
        return ["no compila: %s (linea %s)" % (e.msg, e.lineno)]
    defs = [n for n in ast.walk(arbol) if isinstance(n, ast.FunctionDef)]
    if len(defs) != 1:
        problemas.append("debe haber exactamente 1 funcion, hay %d" % len(defs))
    nombres_fn = {d.name for d in defs}
    for n in ast.walk(arbol):
        t = type(n)
        if t in PROHIBIDOS:
            problemas.append("usa %s (linea %s)" % (PROHIBIDOS[t], getattr(n, "lineno", "?")))
        if isinstance(n, ast.BinOp) and not isinstance(n.op, BINOPS):
            problemas.append("operador no permitido (linea %s)" % n.lineno)
        if isinstance(n, ast.AugAssign) and not isinstance(n.op, AUGOPS):
            problemas.append("asignacion aumentada no permitida (linea %s)" % n.lineno)
        if isinstance(n, ast.Compare):
            for op in n.ops:
                if not isinstance(op, CMPOPS):
                    problemas.append("comparador no permitido: in/is (linea %s)" % n.lineno)
        if isinstance(n, ast.Assign):
            for tg in n.targets:
                if not isinstance(tg, ast.Name):
                    problemas.append("asignacion no simple (linea %s)" % n.lineno)
        if isinstance(n, ast.For) and not isinstance(n.target, ast.Name):
            problemas.append("for con desempaquetado (linea %s)" % n.lineno)
        if isinstance(n, ast.FunctionDef):
            a = n.args
            if a.defaults or a.kwonlyargs or a.vararg or a.kwarg:
                problemas.append("parametros especiales (linea %s)" % n.lineno)
        if isinstance(n, ast.Call):
            f = n.func
            if isinstance(f, ast.Name):
                if f.id not in FUNCIONES and f.id not in nombres_fn:
                    problemas.append("funcion no permitida %s() (linea %s)" % (f.id, n.lineno))
            elif isinstance(f, ast.Attribute):
                if f.attr not in METODOS:
                    problemas.append("metodo no permitido .%s() (linea %s)" % (f.attr, n.lineno))
            else:
                problemas.append("llamada rara (linea %s)" % n.lineno)
            if n.keywords:
                problemas.append("argumentos con nombre (linea %s)" % n.lineno)
        if isinstance(n, ast.Attribute) and n.attr not in METODOS:
            problemas.append("atributo no permitido .%s (linea %s)" % (n.attr, n.lineno))
    return problemas
