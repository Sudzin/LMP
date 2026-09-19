"""
Aurora Player — Hotkey Manager
Управление медиа-клавишами
"""
from PySide6.QtCore import QObject, Slot

class HotkeyManager(QObject):
    def __init__(self, player_controller, parent=None):
        super().__init__(parent)
        self.player = player_controller

    @Slot()
    def handle_space(self):
        self.player.toggle_play()

    @Slot(int)
    def handle_seek_step(self, step_sec: int):
        # Перемотка ∓10 сек (с Shift ∓5 сек)
        pass
