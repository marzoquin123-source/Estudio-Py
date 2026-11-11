"""Arnés de pruebas. Lo usan el Web Worker del navegador y tools/verify.mjs,
así que lo que se verifica en el script es exactamente lo que corre en la página."""
import sys
import ast
import json
import math
import traceback

ARCHIVO = "<tu_codigo>"
LIMITE_SALIDA = 3000


class _Captura:
    def __init__(self):
        self.partes = []
        self.n = 0
        self.cortada = False

    def write(self, s):
        if self.n >= LIMITE_SALIDA:
            self.cortada = True
            return len(s)
        self.partes.append(s)
        self.n += len(s)
        return len(s)

    def flush(self):
        pass

    def texto(self):
        t = "".join(self.partes)
        return t[:LIMITE_SALIDA]


class _SinEntrada:
    def readline(self, *a):
        raise EOFError("input() no esta disponible")

    def read(self, *a):
        raise EOFError("input() no esta disponible")


def _igual(a, b):
    """Compara valores (no texto). Los float se comparan con tolerancia."""
    if isinstance(a, bool) or isinstance(b, bool):
        return isinstance(a, bool) and isinstance(b, bool) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9)
    if type(a) is not type(b):
        return False
    if isinstance(a, (tuple, list)):
        return len(a) == len(b) and all(_igual(x, y) for x, y in zip(a, b))
    return a == b


def _info_error(e):
    linea = None
    if isinstance(e, SyntaxError):
        linea = e.lineno
        msg = e.msg
    else:
        msg = str(e)
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == ARCHIVO:
                linea = fr.lineno
    return {"tipo": type(e).__name__, "msg": msg, "linea": linea}


_METODOS_NO_MODIFICAN = {
    "upper", "lower", "title", "capitalize", "strip", "replace", "split",
    "join", "union", "difference",
}


def _analizar(codigo, nombre_fn):
    res = {"return_en_ciclo": [], "metodo_sin_guardar": [], "fn_sin_return": False, "fn_con_print": False}
    try:
        arbol = ast.parse(codigo)
    except Exception:
        return res
    for nodo in ast.walk(arbol):
        if isinstance(nodo, (ast.For, ast.While)):
            for st in nodo.body:
                if isinstance(st, ast.Return):
                    res["return_en_ciclo"].append(st.lineno)
        if (
            isinstance(nodo, ast.Expr)
            and isinstance(nodo.value, ast.Call)
            and isinstance(nodo.value.func, ast.Attribute)
            and nodo.value.func.attr in _METODOS_NO_MODIFICAN
        ):
            res["metodo_sin_guardar"].append({"linea": nodo.lineno, "metodo": nodo.value.func.attr})
        if isinstance(nodo, ast.FunctionDef) and nodo.name == nombre_fn:
            retornos = [n for n in ast.walk(nodo) if isinstance(n, ast.Return) and n.value is not None]
            res["fn_sin_return"] = len(retornos) == 0
            res["fn_con_print"] = any(
                isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == "print"
                for n in ast.walk(nodo)
            )
    return res


def ejecutar(codigo, nombre_fn, pruebas_json):
    pruebas = json.loads(pruebas_json)
    out = {"fase": "ok", "salida": "", "salida_cortada": False, "error": None, "pruebas": [],
           "analisis": _analizar(codigo, nombre_fn)}
    captura = _Captura()
    viejo_out, viejo_in = sys.stdout, sys.stdin
    sys.stdout = captura
    sys.stdin = _SinEntrada()
    ns = {"__name__": "__main__"}
    try:
        try:
            exec(compile(codigo, ARCHIVO, "exec"), ns)
        except BaseException as e:  # noqa: BLE001
            out["fase"] = "error_codigo"
            out["error"] = _info_error(e)
            return out
        fn = ns.get(nombre_fn)
        if not callable(fn):
            out["fase"] = "sin_funcion"
            return out
        for p in pruebas:
            r = {"args": p["args"], "oculta": bool(p.get("oculta")), "ok": False,
                 "esperado": None, "obtenido": None, "error": None}
            try:
                esperado = eval(p["esperado"], {})
                r["esperado"] = repr(esperado)
                args = eval("[" + p["args"] + "]", {})
                obtenido = fn(*args)
                r["obtenido"] = repr(obtenido)
                r["ok"] = _igual(obtenido, esperado)
                r["es_none"] = obtenido is None
            except BaseException as e:  # noqa: BLE001
                r["error"] = _info_error(e)
            out["pruebas"].append(r)
            if not r["ok"] and len(out["pruebas"]) >= 1 and r["error"] is None:
                pass
        out["fase"] = "pruebas"
        return out
    finally:
        sys.stdout, sys.stdin = viejo_out, viejo_in
        out["salida"] = captura.texto()
        out["salida_cortada"] = captura.cortada


def ejecutar_json(codigo, nombre_fn, pruebas_json):
    return json.dumps(ejecutar(codigo, nombre_fn, pruebas_json))
