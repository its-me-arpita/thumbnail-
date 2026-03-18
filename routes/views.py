from flask import Blueprint, render_template

views_bp = Blueprint("views", __name__)


@views_bp.route("/")
def index():
    return render_template("generator.html")


@views_bp.route("/history")
def history():
    return render_template("history.html")


@views_bp.route("/templates")
def templates():
    return render_template("templates.html")


@views_bp.route("/editor")
def editor():
    return render_template("editor.html")
