"""
Aurora Player — Settings Manager (QSettings)
"""
from PySide6.QtCore import QObject, QSettings, Signal, Slot

class SettingsManager(QObject):
    settingsChanged = Signal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self._settings = QSettings("AuroraMedia", "AuroraPlayer")

    @Slot(str, str)
    def set_value(self, key: str, value: str):
        self._settings.setValue(key, value)
        self.settingsChanged.emit()

    @Slot(str, str, result=str)
    def get_value(self, key: str, default: str = "") -> str:
        return str(self._settings.value(key, default))
