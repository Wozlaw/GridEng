import importlib

import pytest


def test_lib_modules_import_without_optional_plotting_dependency():
    crossection_module = importlib.import_module("app.lib.Crossection")
    system3d_module = importlib.import_module("app.lib.System3d")

    assert crossection_module.Crossection.__name__ == "Crossection"
    assert system3d_module.Beam.__name__ == "Beam"


def test_plot_methods_fail_with_clear_error_when_matplotlib_is_missing(monkeypatch):
    crossection_module = importlib.import_module("app.lib.Crossection")
    monkeypatch.setattr(crossection_module, "mpl", None)
    monkeypatch.setattr(crossection_module, "plt", None)

    crossection = crossection_module.Crossection().RectShape(10)

    with pytest.raises(ModuleNotFoundError, match="matplotlib is required"):
        crossection.plot()
