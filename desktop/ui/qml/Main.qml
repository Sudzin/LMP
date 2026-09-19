import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtMultimedia

ApplicationWindow {
    id: window
    visible: true
    width: 1200
    height: 780
    minimumWidth: 900
    minimumHeight: 600
    title: "Aurora Player — " + (playerController.currentTrack.title || "Медиаплеер")
    color: "#0d0914"

    property int currentTab: 0 // 0: Медиатека, 1: Видео, 2: Настройки
    property bool isFullscreen: false

    // Функция форматирования миллисекунд в MM:SS
    function formatTime(ms) {
        if (!ms || ms <= 0) return "00:00"
        var totalSec = Math.floor(ms / 1000)
        var min = Math.floor(totalSec / 60)
        var sec = totalSec % 60
        var minStr = (min < 10 ? "0" : "") + min
        var secStr = (sec < 10 ? "0" : "") + sec
        return minStr + ":" + secStr
    }

    // Горячие клавиши
    Shortcut {
        sequence: "Space"
        onActivated: playerController.toggle_play()
    }
    Shortcut {
        sequence: "Left"
        onActivated: playerController.seek(Math.max(0, playerController.position - 5000))
    }
    Shortcut {
        sequence: "Right"
        onActivated: playerController.seek(Math.min(playerController.duration, playerController.position + 5000))
    }
    Shortcut {
        sequence: "Up"
        onActivated: playerController.set_volume(playerController.volume + 0.05)
    }
    Shortcut {
        sequence: "Down"
        onActivated: playerController.set_volume(playerController.volume - 0.05)
    }
    Shortcut {
        sequence: "F"
        onActivated: toggleFullscreen()
    }
    Shortcut {
        sequence: "F11"
        onActivated: toggleFullscreen()
    }

    function toggleFullscreen() {
        if (window.visibility === Window.FullScreen) {
            window.showNormal()
            window.isFullscreen = false
        } else {
            window.showFullScreen()
            window.isFullscreen = true
        }
    }

    // Drag-and-drop файлов в окно
    DropArea {
        anchors.fill: parent
        onDropped: (drop) => {
            if (drop.hasUrls) {
                var paths = []
                for (var i = 0; i < drop.urls.length; i++) {
                    var u = drop.urls[i].toString()
                    if (u.indexOf("file:///") === 0) {
                        paths.push(u.replace("file:///", ""))
                    }
                }
                if (paths.length > 0) {
                    playerController.add_files(paths)
                }
            }
        }
    }

    // Основная сетка
    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // Главное тело (Сайдбар + Контент)
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            // 1. Сайдбар
            Rectangle {
                Layout.fillHeight: true
                Layout.preferredWidth: 230
                color: "#120d1c"
                border.color: "#1a1326"
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 14

                    // Бренд / Логотип
                    RowLayout {
                        spacing: 10
                        Rectangle {
                            width: 34
                            height: 34
                            radius: 10
                            gradient: Gradient {
                                orientation: Gradient.Horizontal
                                GradientStop { position: 0.0; color: "#f43f5e" }
                                GradientStop { position: 1.0; color: "#8b5cf6" }
                            }
                            Text {
                                anchors.centerIn: parent
                                text: "▶"
                                color: "white"
                                font.pixelSize: 14
                            }
                        }

                        ColumnLayout {
                            spacing: 1
                            Text {
                                text: "AURORA"
                                color: "white"
                                font.pixelSize: 16
                                font.bold: true
                            }
                            Text {
                                text: "Media Player"
                                color: "#9ca3af"
                                font.pixelSize: 11
                            }
                        }
                    }

                    // Кнопки открытия файлов
                    Button {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 38
                        background: Rectangle {
                            color: "#f43f5e"
                            radius: 8
                        }
                        contentItem: Text {
                            text: "+ Открыть файлы"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 13
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        onClicked: playerController.open_file_dialog()
                    }

                    Button {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 36
                        background: Rectangle {
                            color: "#221a30"
                            border.color: "#3a2c52"
                            radius: 8
                        }
                        contentItem: Text {
                            text: "📁 Открыть папку"
                            color: "#e2e8f0"
                            font.pixelSize: 12
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        onClicked: playerController.open_folder_dialog()
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: "#271c3b"
                    }

                    // Навигация по вкладкам
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Repeater {
                            model: [
                                { label: "🎵  Медиатека", idx: 0 },
                                { label: "🎬  Видео", idx: 1 },
                                { label: "⚙️  Настройки", idx: 2 }
                            ]
                            delegate: Button {
                                Layout.fillWidth: true
                                Layout.preferredHeight: 40
                                background: Rectangle {
                                    color: window.currentTab === modelData.idx ? "#2b1c42" : "transparent"
                                    radius: 8
                                }
                                contentItem: Text {
                                    text: modelData.label
                                    color: window.currentTab === modelData.idx ? "white" : "#9ca3af"
                                    font.bold: window.currentTab === modelData.idx
                                    font.pixelSize: 13
                                    leftPadding: 12
                                    verticalAlignment: Text.AlignVCenter
                                }
                                onClicked: {
                                    window.currentTab = modelData.idx
                                }
                            }
                        }

                        Button {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 40
                            background: Rectangle {
                                color: "transparent"
                                radius: 8
                            }
                            contentItem: Text {
                                text: "🎚️  Эквалайзер"
                                color: "#9ca3af"
                                font.pixelSize: 13
                                leftPadding: 12
                                verticalAlignment: Text.AlignVCenter
                            }
                            onClicked: eqModal.visible = true
                        }
                    }

                    Item { Layout.fillHeight: true }

                    // Информация о библиотеке
                    Rectangle {
                        Layout.fillWidth: true
                        height: 50
                        color: "#181024"
                        radius: 8
                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 2
                            Text {
                                text: "В медиатеке: " + playerController.tracks.length + " треков"
                                color: "#9ca3af"
                                font.pixelSize: 11
                                Layout.alignment: Qt.AlignHCenter
                            }
                            Text {
                                text: "Форматы: MP3, FLAC, MP4..."
                                color: "#6b7280"
                                font.pixelSize: 10
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }
                    }
                }
            }

            // 2. Рабочая область
            StackLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                currentIndex: window.currentTab

                // === Вкладка 0: Медиатека ===
                Item {
                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 20
                        spacing: 16

                        // Верхняя панель медиатеки
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 12

                            Text {
                                text: "Все медиафайлы"
                                color: "white"
                                font.bold: true
                                font.pixelSize: 22
                            }

                            Item { Layout.fillWidth: true }

                            TextField {
                                id: searchInput
                                placeholderText: "Поиск по названию или артисту..."
                                color: "white"
                                placeholderTextColor: "#6b7280"
                                Layout.preferredWidth: 260
                                background: Rectangle {
                                    color: "#181024"
                                    border.color: "#2d1c47"
                                    radius: 8
                                }
                            }
                        }

                        // Таблица / Заголовок колонок
                        Rectangle {
                            Layout.fillWidth: true
                            height: 36
                            color: "#140e21"
                            radius: 6

                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: 16
                                anchors.rightMargin: 16
                                spacing: 10

                                Text { text: "#"; color: "#6b7280"; font.bold: true; font.pixelSize: 11; Layout.preferredWidth: 30 }
                                Text { text: "НАЗВАНИЕ"; color: "#6b7280"; font.bold: true; font.pixelSize: 11; Layout.fillWidth: true }
                                Text { text: "ИСПОЛНИТЕЛЬ"; color: "#6b7280"; font.bold: true; font.pixelSize: 11; Layout.preferredWidth: 180 }
                                Text { text: "АЛЬБОМ"; color: "#6b7280"; font.bold: true; font.pixelSize: 11; Layout.preferredWidth: 150 }
                                Text { text: "ДЛИТ."; color: "#6b7280"; font.bold: true; font.pixelSize: 11; Layout.preferredWidth: 60; horizontalAlignment: Text.AlignRight }
                                Text { text: "ДЕЙСТВИЯ"; color: "#6b7280"; font.bold: true; font.pixelSize: 11; Layout.preferredWidth: 80; horizontalAlignment: Text.AlignRight }
                            }
                        }

                        // Список треков
                        ListView {
                            id: tracksListView
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            clip: true
                            spacing: 4
                            model: playerController.tracks

                            delegate: Rectangle {
                                width: tracksListView.width
                                height: 48
                                radius: 8
                                color: {
                                    if (playerController.currentTrack.file_path === modelData.file_path) return "#2c173d"
                                    if (itemMouseArea.containsMouse) return "#1d142b"
                                    return "transparent"
                                }

                                MouseArea {
                                    id: itemMouseArea
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    onDoubleClicked: {
                                        playerController.play_track(index)
                                        if (modelData.is_video) {
                                            window.currentTab = 1
                                        }
                                    }
                                }

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 16
                                    anchors.rightMargin: 16
                                    spacing: 10

                                    // Номер или статус
                                    Text {
                                        text: (playerController.currentTrack.file_path === modelData.file_path && playerController.isPlaying) ? "▶" : (index + 1)
                                        color: (playerController.currentTrack.file_path === modelData.file_path) ? "#f43f5e" : "#9ca3af"
                                        font.pixelSize: 12
                                        Layout.preferredWidth: 30
                                    }

                                    // Название + бейдж
                                    RowLayout {
                                        Layout.fillWidth: true
                                        spacing: 8
                                        Text {
                                            text: modelData.title || "Без названия"
                                            color: (playerController.currentTrack.file_path === modelData.file_path) ? "#f43f5e" : "white"
                                            font.bold: (playerController.currentTrack.file_path === modelData.file_path)
                                            font.pixelSize: 13
                                            elide: Text.ElideRight
                                        }
                                        Rectangle {
                                            visible: modelData.is_video
                                            width: 38
                                            height: 16
                                            radius: 4
                                            color: "#8b5cf6"
                                            Text {
                                                anchors.centerIn: parent
                                                text: "VIDEO"
                                                color: "white"
                                                font.pixelSize: 9
                                                font.bold: true
                                            }
                                        }
                                    }

                                    Text {
                                        text: modelData.artist || "—"
                                        color: "#9ca3af"
                                        font.pixelSize: 12
                                        Layout.preferredWidth: 180
                                        elide: Text.ElideRight
                                    }

                                    Text {
                                        text: modelData.album || "—"
                                        color: "#6b7280"
                                        font.pixelSize: 12
                                        Layout.preferredWidth: 150
                                        elide: Text.ElideRight
                                    }

                                    Text {
                                        text: window.formatTime(modelData.duration * 1000)
                                        color: "#9ca3af"
                                        font.pixelSize: 12
                                        Layout.preferredWidth: 60
                                        horizontalAlignment: Text.AlignRight
                                    }

                                    // Действия: избранное и удалить
                                    RowLayout {
                                        Layout.preferredWidth: 80
                                        spacing: 8
                                        Layout.alignment: Qt.AlignRight

                                        Button {
                                            background: Rectangle { color: "transparent" }
                                            contentItem: Text {
                                                text: modelData.is_favorite ? "♥" : "♡"
                                                color: modelData.is_favorite ? "#f43f5e" : "#6b7280"
                                                font.pixelSize: 16
                                            }
                                            onClicked: playerController.toggle_favorite(index)
                                        }

                                        Button {
                                            background: Rectangle { color: "transparent" }
                                            contentItem: Text {
                                                text: "✕"
                                                color: "#6b7280"
                                                font.pixelSize: 13
                                            }
                                            onClicked: playerController.delete_track(index)
                                        }
                                    }
                                }
                            }
                        }

                        // Заглушка если треков нет
                        Item {
                            visible: playerController.tracks.length === 0
                            Layout.fillWidth: true
                            Layout.fillHeight: true

                            ColumnLayout {
                                anchors.centerIn: parent
                                spacing: 14

                                Text {
                                    text: "📁 Медиатека пуста"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 20
                                    Layout.alignment: Qt.AlignHCenter
                                }

                                Text {
                                    text: "Нажмите кнопку «Открыть файлы» или перетащите аудио/видео прямо сюда"
                                    color: "#9ca3af"
                                    font.pixelSize: 13
                                    Layout.alignment: Qt.AlignHCenter
                                }

                                Button {
                                    Layout.alignment: Qt.AlignHCenter
                                    text: "Выбрать файлы на компьютере"
                                    background: Rectangle {
                                        color: "#f43f5e"
                                        radius: 8
                                    }
                                    contentItem: Text {
                                        text: "Выбрать файлы на компьютере"
                                        color: "white"
                                        font.bold: true
                                        font.pixelSize: 13
                                        leftPadding: 16
                                        rightPadding: 16
                                        topPadding: 8
                                        bottomPadding: 8
                                    }
                                    onClicked: playerController.open_file_dialog()
                                }
                            }
                        }
                    }
                }

                // === Вкладка 1: Видео плеер ===
                Rectangle {
                    color: "black"

                    VideoOutput {
                        id: videoOutput
                        anchors.fill: parent

                        Component.onCompleted: {
                            playerController.set_video_sink(videoOutput.videoSink)
                        }
                    }

                    // Плашка, если видео не воспроизводится
                    ColumnLayout {
                        anchors.centerIn: parent
                        visible: !playerController.currentTrack.is_video
                        spacing: 12

                        Text {
                            text: "🎬 Видео экран"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 20
                            Layout.alignment: Qt.AlignHCenter
                        }
                        Text {
                            text: "Запустите видеофайл (.mp4, .mkv, .avi, .mov) из списка медиатеки"
                            color: "#9ca3af"
                            font.pixelSize: 13
                            Layout.alignment: Qt.AlignHCenter
                        }
                    }
                }

                // === Вкладка 2: Настройки ===
                Rectangle {
                    color: "#0f0b17"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 30
                        spacing: 20

                        Text {
                            text: "Настройки и управление"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 22
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 180
                            color: "#181024"
                            radius: 12

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 18
                                spacing: 8

                                Text {
                                    text: "Горячие клавиши:"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 14
                                }
                                Text { text: "• Пробел (Space) — Воспроизведение / Пауза"; color: "#cbd5e1"; font.pixelSize: 13 }
                                Text { text: "• Стрелки ← / → — Перемотка на 5 секунд назад/вперед"; color: "#cbd5e1"; font.pixelSize: 13 }
                                Text { text: "• Стрелки ↑ / ↓ — Регулировка громкости ±5%"; color: "#cbd5e1"; font.pixelSize: 13 }
                                Text { text: "• F или F11 — Полноэкранный режим"; color: "#cbd5e1"; font.pixelSize: 13 }
                            }
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 120
                            color: "#181024"
                            radius: 12

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 18
                                spacing: 8

                                Text {
                                    text: "О приложении Aurora Player Desktop:"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 14
                                }
                                Text { text: "Локальный полнофункциональный аудио/видео плеер на Python 3.12 + PySide6 (Qt 6.7+)"; color: "#9ca3af"; font.pixelSize: 12 }
                                Text { text: "База данных библиотеки: %APPDATA%/AuroraPlayer/library.db"; color: "#9ca3af"; font.pixelSize: 12 }
                            }
                        }

                        Item { Layout.fillHeight: true }
                    }
                }
            }
        }

        // 3. Нижняя панель управления (Player Bar)
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 88
            color: "#110c1a"
            border.color: "#1d142b"
            border.width: 1

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 20
                anchors.rightMargin: 20
                spacing: 16

                // Левая часть: информация о текущем треке
                RowLayout {
                    Layout.preferredWidth: 260
                    spacing: 12

                    Rectangle {
                        width: 50
                        height: 50
                        radius: 8
                        gradient: Gradient {
                            orientation: Gradient.TopToBottom
                            GradientStop { position: 0.0; color: "#e11d48" }
                            GradientStop { position: 1.0; color: "#7c3aed" }
                        }
                        Text {
                            anchors.centerIn: parent
                            text: playerController.currentTrack.is_video ? "🎬" : "🎵"
                            font.pixelSize: 22
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 2
                        Text {
                            text: playerController.currentTrack.title || "Нет трека"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 13
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }
                        Text {
                            text: playerController.currentTrack.artist || "Выберите файл"
                            color: "#9ca3af"
                            font.pixelSize: 11
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }
                    }
                }

                // Центральная часть: кнопки плеера и таймлайн
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4

                    // Кнопки управления
                    RowLayout {
                        Layout.alignment: Qt.AlignHCenter
                        spacing: 16

                        Button {
                            background: Rectangle { color: "transparent" }
                            contentItem: Text { text: "⏮"; color: "white"; font.pixelSize: 16 }
                            onClicked: playerController.previous_track()
                        }

                        // Play/Pause кнопка
                        Rectangle {
                            width: 38
                            height: 38
                            radius: 19
                            color: "#f43f5e"

                            MouseArea {
                                anchors.fill: parent
                                onClicked: playerController.toggle_play()
                            }

                            Text {
                                anchors.centerIn: parent
                                text: playerController.isPlaying ? "❚❚" : "▶"
                                color: "white"
                                font.pixelSize: 14
                            }
                        }

                        Button {
                            background: Rectangle { color: "transparent" }
                            contentItem: Text { text: "⏭"; color: "white"; font.pixelSize: 16 }
                            onClicked: playerController.next_track()
                        }
                    }

                    // Таймлайн (Seek bar)
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        Text {
                            text: window.formatTime(playerController.position)
                            color: "#9ca3af"
                            font.pixelSize: 11
                        }

                        Slider {
                            id: progressSlider
                            Layout.fillWidth: true
                            from: 0
                            to: Math.max(1, playerController.duration)
                            value: playerController.position

                            onMoved: {
                                playerController.seek(value)
                            }
                        }

                        Text {
                            text: window.formatTime(playerController.duration)
                            color: "#9ca3af"
                            font.pixelSize: 11
                        }
                    }
                }

                // Правая часть: эквалайзер и громкость
                RowLayout {
                    Layout.preferredWidth: 240
                    spacing: 12
                    Layout.alignment: Qt.AlignRight

                    Button {
                        background: Rectangle { color: "transparent" }
                        contentItem: Text { text: "🎚️"; color: "white"; font.pixelSize: 16 }
                        onClicked: eqModal.visible = !eqModal.visible
                    }

                    Text { text: "🔊"; color: "#9ca3af"; font.pixelSize: 14 }

                    Slider {
                        id: volumeSlider
                        Layout.preferredWidth: 90
                        from: 0.0
                        to: 1.0
                        value: playerController.volume
                        onMoved: {
                            playerController.set_volume(value)
                        }
                    }

                    Button {
                        background: Rectangle { color: "transparent" }
                        contentItem: Text { text: window.isFullscreen ? "🗗" : "⛶"; color: "white"; font.pixelSize: 15 }
                        onClicked: window.toggleFullscreen()
                    }
                }
            }
        }
    }

    // Модальное окно эквалайзера
    Rectangle {
        id: eqModal
        anchors.fill: parent
        color: "#99000000"
        visible: false
        z: 99

        MouseArea {
            anchors.fill: parent
            onClicked: eqModal.visible = false
        }

        EqualizerModal {
            anchors.centerIn: parent
            onCloseRequested: eqModal.visible = false
        }
    }
}
