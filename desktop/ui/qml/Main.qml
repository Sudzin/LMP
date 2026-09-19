import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Window
import QtMultimedia

ApplicationWindow {
    id: window
    width: 1440
    height: 900
    minimumWidth: 1100
    minimumHeight: 700
    visible: true
    title: "Aurora Player — " + (playerController.currentTrack.title || "Медиаплеер")
    color: "#090711"

    property color bg: "#090711"
    property color panel: "#11101d"
    property color panel2: "#171326"
    property color border: "#28213d"
    property color textPrimary: "#f7f3ff"
    property color textSecondary: "#9f97b5"
    property color accentPink: "#ff3f88"
    property color accentPurple: "#9b4dff"
    property color accentOrange: "#ff7a4d"

    property int activeNavIndex: 1  // 0: Главная, 1: Медиатека, 2: Видео/Экран, 3: Избранное, 4: Настройки
    property int selectedCategory: 0 // 0: Все, 1: Музыка, 2: Видео, 3: Избранное
    property string searchQuery: ""
    property int sortIndex: 0 // 0: По дате добавления, 1: По названию, 2: По исполнителю, 3: По длительности

    // Форматирование миллисекунд в MM:SS
    function formatTime(ms) {
        if (!ms || ms <= 0) return "00:00"
        var totalSec = Math.floor(ms / 1000)
        var min = Math.floor(totalSec / 60)
        var sec = totalSec % 60
        return (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec
    }

    // Подсчет треков по категориям
    function getCategoryCount(type) {
        if (!playerController.tracks) return 0
        var total = playerController.tracks.length
        if (type === "all") return total
        var count = 0
        for (var i = 0; i < total; i++) {
            var t = playerController.tracks[i]
            if (type === "music" && !t.is_video) count++
            else if (type === "video" && t.is_video) count++
            else if (type === "fav" && t.is_favorite) count++
        }
        return count
    }

    // Полноэкранный режим
    function toggleFullscreen() {
        if (window.visibility === Window.FullScreen) {
            window.showNormal()
        } else {
            window.showFullScreen()
        }
    }

    // Горячие клавиши
    Shortcut { sequence: "Space"; onActivated: playerController.toggle_play() }
    Shortcut { sequence: "Left"; onActivated: playerController.seek(Math.max(0, playerController.position - 5000)) }
    Shortcut { sequence: "Right"; onActivated: playerController.seek(Math.min(playerController.duration, playerController.position + 5000)) }
    Shortcut { sequence: "Up"; onActivated: playerController.set_volume(playerController.volume + 0.05) }
    Shortcut { sequence: "Down"; onActivated: playerController.set_volume(playerController.volume - 0.05) }
    Shortcut { sequence: "F"; onActivated: toggleFullscreen() }
    Shortcut { sequence: "F11"; onActivated: toggleFullscreen() }

    // Drag-and-Drop файлов
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

    Rectangle {
        anchors.fill: parent
        color: bg

        // Нежное фоновое свечение из концепта
        Rectangle {
            width: parent.width * 0.55
            height: parent.height * 0.8
            x: parent.width * 0.18
            y: -parent.height * 0.25
            radius: width / 2
            opacity: 0.12
            gradient: Gradient {
                GradientStop { position: 0.0; color: accentPurple }
                GradientStop { position: 0.45; color: accentPink }
                GradientStop { position: 1.0; color: "transparent" }
            }
        }

        RowLayout {
            anchors.fill: parent
            anchors.bottomMargin: 82
            spacing: 0

            // ==========================================
            // 1. ЛЕВЫЙ САЙДБАР (LEFT NAVIGATION)
            // ==========================================
            Rectangle {
                Layout.preferredWidth: 238
                Layout.fillHeight: true
                color: "#0c0a15"
                border.color: "#201a31"
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 18
                    spacing: 18

                    // Логотип Aurora
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 11

                        Rectangle {
                            width: 40
                            height: 40
                            radius: 12
                            gradient: Gradient {
                                GradientStop { position: 0; color: accentPink }
                                GradientStop { position: 1; color: accentPurple }
                            }

                            Text {
                                anchors.centerIn: parent
                                text: "A"
                                color: "white"
                                font.pixelSize: 22
                                font.bold: true
                            }
                        }

                        ColumnLayout {
                            spacing: 0
                            Text {
                                text: "AURORA"
                                color: textPrimary
                                font.pixelSize: 18
                                font.bold: true
                                font.letterSpacing: 1.5
                            }
                            Text {
                                text: "MEDIA PLAYER"
                                color: accentPink
                                font.pixelSize: 8
                                font.bold: true
                                font.letterSpacing: 1.3
                            }
                        }
                    }

                    // Кнопка Открыть файл
                    Button {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 44
                        text: "+  Открыть файл"
                        font.pixelSize: 13
                        font.bold: true
                        onClicked: playerController.open_file_dialog()

                        background: Rectangle {
                            radius: 10
                            gradient: Gradient {
                                GradientStop { position: 0; color: accentPink }
                                GradientStop { position: 1; color: accentPurple }
                            }
                        }
                        contentItem: Text {
                            text: parent.text
                            color: "white"
                            font: parent.font
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }

                    // Кнопка Добавить папку
                    Button {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 40
                        text: "＋  Добавить папку"
                        onClicked: playerController.open_folder_dialog()

                        background: Rectangle {
                            radius: 10
                            color: panel2
                            border.color: border
                        }
                        contentItem: Text {
                            text: parent.text
                            color: textSecondary
                            font.pixelSize: 12
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: border
                    }

                    // Меню навигации
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Repeater {
                            model: [
                                ["⌂", "Главная", 0],
                                ["♫", "Медиатека", 1],
                                ["▣", "Видео экран", 2],
                                ["♡", "Избранное", 3],
                                ["🎚️", "Эквалайзер", 5]
                            ]

                            delegate: Rectangle {
                                id: navItem
                                Layout.fillWidth: true
                                height: 40
                                radius: 9
                                property bool isActive: (window.activeNavIndex === modelData[2])
                                color: isActive ? "#28163b" : (navMouse.containsMouse ? "#181226" : "transparent")

                                Rectangle {
                                    visible: parent.isActive
                                    width: 3
                                    height: 24
                                    radius: 2
                                    anchors.left: parent.left
                                    anchors.verticalCenter: parent.verticalCenter
                                    color: accentPink
                                }

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 16
                                    anchors.rightMargin: 10
                                    spacing: 14

                                    Text {
                                        text: modelData[0]
                                        color: navItem.isActive ? accentPink : textSecondary
                                        font.pixelSize: 17
                                        Layout.preferredWidth: 22
                                        horizontalAlignment: Text.AlignHCenter
                                    }

                                    Text {
                                        text: modelData[1]
                                        color: navItem.isActive ? textPrimary : textSecondary
                                        font.pixelSize: 13
                                        font.bold: navItem.isActive
                                    }
                                }

                                MouseArea {
                                    id: navMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        if (modelData[2] === 5) {
                                            eqModal.visible = true
                                        } else {
                                            window.activeNavIndex = modelData[2]
                                            if (modelData[2] === 3) {
                                                window.selectedCategory = 3 // Избранное
                                            } else if (modelData[2] === 1) {
                                                window.selectedCategory = 0 // Все
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Item { Layout.fillHeight: true }

                    // Карточка состояния библиотеки
                    Rectangle {
                        Layout.fillWidth: true
                        height: 62
                        radius: 12
                        color: panel2
                        border.color: border

                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 10
                            spacing: 10

                            Rectangle {
                                width: 40
                                height: 40
                                radius: 9
                                color: "#6e3e9f"
                                Text {
                                    anchors.centerIn: parent
                                    text: "♫"
                                    color: "white"
                                    font.pixelSize: 20
                                }
                            }

                            ColumnLayout {
                                spacing: 2
                                Text {
                                    text: "В медиатеке"
                                    color: textPrimary
                                    font.pixelSize: 11
                                    font.bold: true
                                }
                                Text {
                                    text: playerController.tracks.length + " файлов"
                                    color: textSecondary
                                    font.pixelSize: 10
                                }
                            }
                        }
                    }

                    Button {
                        Layout.fillWidth: true
                        text: "⚙  Настройки"
                        background: null
                        onClicked: window.activeNavIndex = 4
                        contentItem: Text {
                            text: parent.text
                            color: window.activeNavIndex === 4 ? accentPink : textSecondary
                            font.pixelSize: 12
                            horizontalAlignment: Text.AlignLeft
                        }
                    }
                }
            }

            // ==========================================
            // 2. ЦЕНТРАЛЬНАЯ РАБОЧАЯ ОБЛАСТЬ
            // ==========================================
            StackLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                currentIndex: (window.activeNavIndex === 2) ? 1 : ((window.activeNavIndex === 4) ? 2 : 0)

                // --- 0. ОСНОВНОЙ ЭКРАН (МЕДИАТЕКА) ---
                Rectangle {
                    color: "transparent"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 28
                        spacing: 18

                        // Верхняя строка заголовка и поиска
                        RowLayout {
                            Layout.fillWidth: true

                            ColumnLayout {
                                spacing: 4
                                Text {
                                    text: "МЕДИАТЕКА"
                                    color: accentPink
                                    font.pixelSize: 10
                                    font.bold: true
                                    font.letterSpacing: 1.6
                                }
                                Text {
                                    text: "Мои треки и медиа"
                                    color: textPrimary
                                    font.pixelSize: 29
                                    font.bold: true
                                }
                                Text {
                                    text: playerController.tracks.length + " файлов  •  локальная коллекция  •  полностью офлайн"
                                    color: textSecondary
                                    font.pixelSize: 12
                                }
                            }

                            Item { Layout.fillWidth: true }

                            TextField {
                                id: searchField
                                Layout.preferredWidth: 280
                                Layout.preferredHeight: 40
                                placeholderText: "Поиск по медиатеке..."
                                color: textPrimary
                                placeholderTextColor: "#716a84"
                                leftPadding: 16
                                rightPadding: 16
                                onTextChanged: window.searchQuery = text.toLowerCase()
                                background: Rectangle {
                                    radius: 20
                                    color: panel2
                                    border.color: searchField.activeFocus ? accentPink : border
                                }
                            }
                        }

                        // Карточки категорий
                        RowLayout {
                            Layout.fillWidth: true
                            spacing: 10

                            Repeater {
                                model: [
                                    ["♫", "Музыка", window.getCategoryCount("music") + " файлов", 1],
                                    ["▣", "Видео", window.getCategoryCount("video") + " файла", 2],
                                    ["♡", "Избранное", window.getCategoryCount("fav") + " трека", 3],
                                    ["↻", "Все треки", window.getCategoryCount("all") + " файлов", 0]
                                ]

                                delegate: Rectangle {
                                    id: catCard
                                    Layout.fillWidth: true
                                    height: 76
                                    radius: 14
                                    property bool isSelected: (window.selectedCategory === modelData[3])
                                    color: isSelected ? "#241738" : (catMouse.containsMouse ? "#181427" : panel)
                                    border.color: isSelected ? accentPink : border

                                    RowLayout {
                                        anchors.fill: parent
                                        anchors.margins: 13
                                        spacing: 12

                                        Rectangle {
                                            width: 42
                                            height: 42
                                            radius: 12
                                            color: catCard.isSelected ? "#4b1c6d" : "#211a34"
                                            Text {
                                                anchors.centerIn: parent
                                                text: modelData[0]
                                                color: accentPink
                                                font.pixelSize: 21
                                            }
                                        }

                                        ColumnLayout {
                                            spacing: 3
                                            Text {
                                                text: modelData[1]
                                                color: textPrimary
                                                font.pixelSize: 12
                                                font.bold: true
                                            }
                                            Text {
                                                text: modelData[2]
                                                color: textSecondary
                                                font.pixelSize: 10
                                            }
                                        }
                                    }

                                    MouseArea {
                                        id: catMouse
                                        anchors.fill: parent
                                        hoverEnabled: true
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: {
                                            window.selectedCategory = modelData[3]
                                            if (modelData[3] === 2) {
                                                // Видео
                                                window.activeNavIndex = 2
                                            } else if (modelData[3] === 3) {
                                                window.activeNavIndex = 3
                                            } else {
                                                window.activeNavIndex = 1
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Строка сортировки
                        RowLayout {
                            Layout.fillWidth: true

                            Text {
                                text: "Треки"
                                color: textPrimary
                                font.pixelSize: 19
                                font.bold: true
                            }

                            Item { Layout.fillWidth: true }

                            ComboBox {
                                id: sortCombo
                                model: ["По порядку добавления", "По названию", "По исполнителю", "По альбому", "По длительности"]
                                Layout.preferredWidth: 200
                                Layout.preferredHeight: 34
                                currentIndex: window.sortIndex
                                onActivated: (idx) => window.sortIndex = idx
                            }
                        }

                        // Главная таблица треков
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            radius: 14
                            color: "#0d0b17"
                            border.color: border
                            clip: true

                            ColumnLayout {
                                anchors.fill: parent
                                spacing: 0

                                // Заголовки таблицы
                                Rectangle {
                                    Layout.fillWidth: true
                                    height: 40
                                    color: "#141021"

                                    RowLayout {
                                        anchors.fill: parent
                                        anchors.leftMargin: 18
                                        anchors.rightMargin: 18

                                        Text { text: "#"; color: "#686078"; font.pixelSize: 10; font.bold: true; Layout.preferredWidth: 32 }
                                        Text { text: "ТРЕК"; color: "#686078"; font.pixelSize: 10; font.bold: true; Layout.fillWidth: true }
                                        Text { text: "ИСПОЛНИТЕЛЬ"; color: "#686078"; font.pixelSize: 10; font.bold: true; Layout.preferredWidth: 160 }
                                        Text { text: "АЛЬБОМ"; color: "#686078"; font.pixelSize: 10; font.bold: true; Layout.preferredWidth: 170 }
                                        Text { text: "ВРЕМЯ"; color: "#686078"; font.pixelSize: 10; font.bold: true; Layout.preferredWidth: 55 }
                                        Item { Layout.preferredWidth: 60 }
                                    }
                                }

                                // Список треков ListView
                                ListView {
                                    id: trackList
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true
                                    model: playerController.tracks
                                    clip: true
                                    spacing: 0

                                    delegate: Rectangle {
                                        id: rowDelegate
                                        width: trackList.width

                                        property bool isCurrent: (playerController.currentTrack.file_path === modelData.file_path)
                                        property bool matchesFilter: {
                                            if (window.selectedCategory === 1) return !modelData.is_video
                                            if (window.selectedCategory === 2) return modelData.is_video
                                            if (window.selectedCategory === 3) return modelData.is_favorite
                                            return true
                                        }
                                        property bool matchesSearch: (window.searchQuery === "" || 
                                            (modelData.title && modelData.title.toLowerCase().indexOf(window.searchQuery) !== -1) ||
                                            (modelData.artist && modelData.artist.toLowerCase().indexOf(window.searchQuery) !== -1))

                                        visible: matchesFilter && matchesSearch
                                        height: (matchesFilter && matchesSearch) ? 62 : 0

                                        color: isCurrent ? "#26153d" : (mouse.containsMouse ? "#181329" : "transparent")
                                        border.color: isCurrent ? accentPink : (mouse.containsMouse ? "#30224b" : "transparent")

                                        MouseArea {
                                            id: mouse
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            cursorShape: Qt.PointingHandCursor
                                            onDoubleClicked: {
                                                playerController.play_track(index)
                                                if (modelData.is_video) {
                                                    window.activeNavIndex = 2
                                                }
                                            }
                                        }

                                        RowLayout {
                                            anchors.fill: parent
                                            anchors.leftMargin: 18
                                            anchors.rightMargin: 12
                                            spacing: 8

                                            Text {
                                                text: index + 1
                                                color: isCurrent ? accentPink : "#665f76"
                                                font.pixelSize: 11
                                                font.bold: isCurrent
                                                Layout.preferredWidth: 32
                                            }

                                            RowLayout {
                                                Layout.fillWidth: true
                                                spacing: 12

                                                // Иконка / обложка трека
                                                Rectangle {
                                                    width: 42
                                                    height: 42
                                                    radius: 8
                                                    color: isCurrent ? "#831843" : "#28193f"
                                                    clip: true

                                                    Image {
                                                        anchors.fill: parent
                                                        source: modelData.cover_url || ""
                                                        fillMode: Image.PreserveAspectCrop
                                                        visible: modelData.cover_url !== ""
                                                    }

                                                    Text {
                                                        anchors.centerIn: parent
                                                        visible: !modelData.cover_url
                                                        text: modelData.is_video ? "▣" : "♫"
                                                        color: "white"
                                                        font.pixelSize: 17
                                                    }
                                                }

                                                ColumnLayout {
                                                    spacing: 3
                                                    Layout.fillWidth: true

                                                    Text {
                                                        text: modelData.title || "Без названия"
                                                        color: isCurrent ? accentPink : textPrimary
                                                        font.pixelSize: 13
                                                        font.bold: true
                                                        elide: Text.ElideRight
                                                        Layout.fillWidth: true
                                                    }
                                                    Text {
                                                        text: modelData.is_video ? "VIDEO" : "AUDIO"
                                                        color: accentPink
                                                        font.pixelSize: 8
                                                        font.bold: true
                                                    }
                                                }
                                            }

                                            Text {
                                                text: modelData.artist || "Неизвестный исполнитель"
                                                color: textSecondary
                                                font.pixelSize: 11
                                                elide: Text.ElideRight
                                                Layout.preferredWidth: 160
                                            }

                                            Text {
                                                text: modelData.album || "Неизвестный альбом"
                                                color: textSecondary
                                                font.pixelSize: 10
                                                elide: Text.ElideRight
                                                Layout.preferredWidth: 170
                                            }

                                            Text {
                                                text: window.formatTime(modelData.duration * 1000)
                                                color: textSecondary
                                                font.pixelSize: 10
                                                Layout.preferredWidth: 55
                                            }

                                            // Избранное
                                            Text {
                                                text: modelData.is_favorite ? "♥" : "♡"
                                                color: modelData.is_favorite ? accentPink : textSecondary
                                                font.pixelSize: 18
                                                Layout.preferredWidth: 22
                                                MouseArea {
                                                    anchors.fill: parent
                                                    cursorShape: Qt.PointingHandCursor
                                                    onClicked: playerController.toggle_favorite(index)
                                                }
                                            }

                                            // Удалить из библиотеки
                                            Text {
                                                text: "✕"
                                                color: textSecondary
                                                font.pixelSize: 13
                                                Layout.preferredWidth: 22
                                                MouseArea {
                                                    anchors.fill: parent
                                                    cursorShape: Qt.PointingHandCursor
                                                    onClicked: playerController.delete_track(index)
                                                }
                                            }
                                        }
                                    }
                                }

                                // Заглушка если файлов нет
                                Item {
                                    visible: playerController.tracks.length === 0
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true

                                    ColumnLayout {
                                        anchors.centerIn: parent
                                        spacing: 12

                                        Rectangle {
                                            width: 56
                                            height: 56
                                            radius: 28
                                            color: panel2
                                            Layout.alignment: Qt.AlignHCenter
                                            Text {
                                                anchors.centerIn: parent
                                                text: "♫"
                                                color: accentPink
                                                font.pixelSize: 24
                                            }
                                        }

                                        Text {
                                            text: "Медиатека пуста"
                                            color: textPrimary
                                            font.bold: true
                                            font.pixelSize: 16
                                            Layout.alignment: Qt.AlignHCenter
                                        }
                                        Text {
                                            text: "Перетащите аудио или видеофайлы в плеер или откройте их кнопкой слева"
                                            color: textSecondary
                                            font.pixelSize: 12
                                            Layout.alignment: Qt.AlignHCenter
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // --- 1. ВИДЕО ЭКРАН ---
                Rectangle {
                    color: "black"

                    VideoOutput {
                        id: videoOutput
                        anchors.fill: parent

                        Component.onCompleted: {
                            playerController.set_video_sink(videoOutput.videoSink)
                        }
                    }

                    ColumnLayout {
                        anchors.centerIn: parent
                        visible: !playerController.currentTrack.is_video
                        spacing: 12

                        Text {
                            text: "🎬"
                            font.pixelSize: 36
                            Layout.alignment: Qt.AlignHCenter
                        }
                        Text {
                            text: "Видео экран"
                            color: textPrimary
                            font.bold: true
                            font.pixelSize: 18
                            Layout.alignment: Qt.AlignHCenter
                        }
                        Text {
                            text: "Воспроизведите видеофайл из медиатеки"
                            color: textSecondary
                            font.pixelSize: 13
                            Layout.alignment: Qt.AlignHCenter
                        }
                    }
                }

                // --- 2. НАСТРОЙКИ ---
                Rectangle {
                    color: "transparent"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 30
                        spacing: 20

                        Text {
                            text: "Настройки Aurora Player"
                            color: textPrimary
                            font.bold: true
                            font.pixelSize: 22
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 180
                            radius: 14
                            color: panel
                            border.color: border

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 20
                                spacing: 10

                                Text {
                                    text: "Горячие клавиши:"
                                    color: textPrimary
                                    font.bold: true
                                    font.pixelSize: 15
                                }
                                Text { text: "• Пробел (Space) — Воспроизведение / Пауза"; color: textSecondary; font.pixelSize: 13 }
                                Text { text: "• ← / → — Перемотка ±5 секунд"; color: textSecondary; font.pixelSize: 13 }
                                Text { text: "• ↑ / ↓ — Громкость ±5%"; color: textSecondary; font.pixelSize: 13 }
                                Text { text: "• F / F11 — Полный экран"; color: textSecondary; font.pixelSize: 13 }
                            }
                        }

                        Item { Layout.fillHeight: true }
                    }
                }
            }

            // ==========================================
            // 3. ПРАВАЯ ПАНЕЛЬ "СЕЙЧАС ИГРАЕТ" (RIGHT PANEL)
            // ==========================================
            Rectangle {
                Layout.preferredWidth: 300
                Layout.fillHeight: true
                color: "#0d0b17"
                border.color: "#211a31"
                border.width: 1

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 22
                    spacing: 16

                    RowLayout {
                        Layout.fillWidth: true
                        Text {
                            text: "СЕЙЧАС ИГРАЕТ"
                            color: accentPink
                            font.pixelSize: 10
                            font.bold: true
                            font.letterSpacing: 1.4
                        }
                        Item { Layout.fillWidth: true }
                        Text {
                            text: playerController.isPlaying ? "АКТИВНО" : "ПАУЗА"
                            color: playerController.isPlaying ? "#34d399" : textSecondary
                            font.bold: true
                            font.pixelSize: 9
                        }
                    }

                    // Большая обложка альбома с градиентом
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 250
                        radius: 16
                        clip: true
                        gradient: Gradient {
                            GradientStop { position: 0; color: "#35164f" }
                            GradientStop { position: 0.5; color: "#7c315e" }
                            GradientStop { position: 1; color: "#1a1230" }
                        }

                        Image {
                            anchors.fill: parent
                            source: playerController.currentTrack.cover_url || ""
                            fillMode: Image.PreserveAspectCrop
                            visible: playerController.currentTrack.cover_url !== ""
                        }

                        Text {
                            anchors.centerIn: parent
                            visible: !playerController.currentTrack.cover_url
                            text: "♫"
                            color: "#ffffff"
                            opacity: 0.75
                            font.pixelSize: 72
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Text {
                            text: playerController.currentTrack.title || "Нет трека"
                            color: textPrimary
                            font.pixelSize: 20
                            font.bold: true
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }

                        Text {
                            text: playerController.currentTrack.artist || "Неизвестный исполнитель"
                            color: textSecondary
                            font.pixelSize: 12
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }
                    }

                    // Прогресс бар таймлайна
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        Text {
                            text: window.formatTime(playerController.position)
                            color: textSecondary
                            font.pixelSize: 9
                        }

                        Rectangle {
                            id: rightProgressBar
                            Layout.fillWidth: true
                            height: 4
                            radius: 2
                            color: "#282038"

                            Rectangle {
                                width: (playerController.duration > 0) ? 
                                       (playerController.position / playerController.duration) * parent.width : 0
                                height: parent.height
                                radius: 2
                                gradient: Gradient {
                                    GradientStop { position: 0; color: accentPink }
                                    GradientStop { position: 1; color: accentPurple }
                                }
                            }

                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: (mouse) => {
                                    if (playerController.duration > 0) {
                                        var pos = (mouse.x / width) * playerController.duration
                                        playerController.seek(pos)
                                    }
                                }
                            }
                        }

                        Text {
                            text: window.formatTime(playerController.duration)
                            color: textSecondary
                            font.pixelSize: 9
                        }
                    }

                    // Кнопки управления в правой панели
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 16

                        Item { Layout.fillWidth: true }
                        Text {
                            text: "⇄"
                            color: playerController.isShuffle ? accentPink : textSecondary
                            font.pixelSize: 18
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.toggle_shuffle()
                            }
                        }
                        Text {
                            text: "|◀"
                            color: textSecondary
                            font.pixelSize: 18
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.previous()
                            }
                        }
                        Rectangle {
                            width: 48
                            height: 48
                            radius: 24
                            gradient: Gradient {
                                GradientStop { position: 0; color: accentPink }
                                GradientStop { position: 1; color: accentPurple }
                            }
                            Text {
                                anchors.centerIn: parent
                                text: playerController.isPlaying ? "❚❚" : "▶"
                                color: "white"
                                font.pixelSize: 15
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.toggle_play()
                            }
                        }
                        Text {
                            text: "▶|"
                            color: textSecondary
                            font.pixelSize: 18
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.next()
                            }
                        }
                        Text {
                            text: "↻"
                            color: playerController.isRepeat ? accentPink : textSecondary
                            font.pixelSize: 18
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.toggle_repeat()
                            }
                        }
                        Item { Layout.fillWidth: true }
                    }

                    // FFT-СПЕКТР
                    Rectangle {
                        Layout.fillWidth: true
                        height: 90
                        radius: 14
                        color: panel
                        border.color: border

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 6

                            RowLayout {
                                Text {
                                    text: "FFT-СПЕКТР"
                                    color: textSecondary
                                    font.pixelSize: 9
                                    font.bold: true
                                }
                                Item { Layout.fillWidth: true }
                                Text {
                                    text: "10 полос"
                                    color: accentPink
                                    font.pixelSize: 9
                                }
                            }

                            RowLayout {
                                Layout.fillWidth: true
                                Layout.fillHeight: true
                                spacing: 3

                                Repeater {
                                    model: [25, 42, 31, 58, 75, 48, 82, 55, 68, 39, 77, 49, 65, 34, 57, 73, 44, 61]
                                    delegate: Rectangle {
                                        Layout.fillWidth: true
                                        Layout.alignment: Qt.AlignBottom
                                        height: playerController.isPlaying ? (parent.height * (modelData / 100)) : 4
                                        radius: 2
                                        gradient: Gradient {
                                            GradientStop { position: 0; color: accentPink }
                                            GradientStop { position: 1; color: accentPurple }
                                        }

                                        Behavior on height {
                                            NumberAnimation { duration: 120 }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Item { Layout.fillHeight: true }

                    // Карточка ФОРМАТ
                    Rectangle {
                        Layout.fillWidth: true
                        height: 80
                        radius: 14
                        color: panel
                        border.color: border

                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 13
                            spacing: 3
                            Text {
                                text: "ФОРМАТ"
                                color: textSecondary
                                font.pixelSize: 9
                            }
                            Text {
                                text: (playerController.currentTrack.file_path ? 
                                       playerController.currentTrack.file_path.split('.').pop().toUpperCase() : "AUDIO") + 
                                       "  •  Lossless  •  44.1 kHz"
                                color: textPrimary
                                font.pixelSize: 11
                                font.bold: true
                            }
                            Text {
                                text: "24-bit  •  Стерео"
                                color: textSecondary
                                font.pixelSize: 9
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // 4. НИЖНЯЯ ПАНЕЛЬ ПЛЕЕРА (BOTTOM PLAYER BAR)
        // ==========================================
        Rectangle {
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            height: 82
            color: "#0b0912"
            border.color: "#272039"
            border.width: 1

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 18
                anchors.rightMargin: 18
                spacing: 16

                // Обложка трека
                Rectangle {
                    width: 50
                    height: 50
                    radius: 8
                    color: "#733c9e"
                    clip: true

                    Image {
                        anchors.fill: parent
                        source: playerController.currentTrack.cover_url || ""
                        fillMode: Image.PreserveAspectCrop
                        visible: playerController.currentTrack.cover_url !== ""
                    }

                    Text {
                        anchors.centerIn: parent
                        visible: !playerController.currentTrack.cover_url
                        text: "♫"
                        color: "white"
                        font.pixelSize: 23
                    }
                }

                // Инфо трека
                ColumnLayout {
                    Layout.preferredWidth: 210
                    spacing: 3
                    Text {
                        text: playerController.currentTrack.title || "Нет трека"
                        color: textPrimary
                        font.pixelSize: 12
                        font.bold: true
                        elide: Text.ElideRight
                        Layout.fillWidth: true
                    }
                    Text {
                        text: playerController.currentTrack.artist || "Неизвестный исполнитель"
                        color: textSecondary
                        font.pixelSize: 10
                        elide: Text.ElideRight
                        Layout.fillWidth: true
                    }
                }

                // Избранное
                Text {
                    text: playerController.currentTrack.is_favorite ? "♥" : "♡"
                    color: playerController.currentTrack.is_favorite ? accentPink : textSecondary
                    font.pixelSize: 20
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (playerController.currentIndex >= 0) {
                                playerController.toggle_favorite(playerController.currentIndex)
                            }
                        }
                    }
                }

                Item { Layout.fillWidth: true }

                // Кнопки управления воспроизведением
                Text {
                    text: "⇄"
                    color: playerController.isShuffle ? accentPink : textSecondary
                    font.pixelSize: 18
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.toggle_shuffle()
                    }
                }
                Text {
                    text: "|◀"
                    color: textSecondary
                    font.pixelSize: 18
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.previous()
                    }
                }

                Rectangle {
                    width: 44
                    height: 44
                    radius: 22
                    gradient: Gradient {
                        GradientStop { position: 0; color: accentPink }
                        GradientStop { position: 1; color: accentPurple }
                    }
                    Text {
                        anchors.centerIn: parent
                        text: playerController.isPlaying ? "❚❚" : "▶"
                        color: "white"
                        font.pixelSize: 14
                    }
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.toggle_play()
                    }
                }

                Text {
                    text: "▶|"
                    color: textSecondary
                    font.pixelSize: 18
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.next()
                    }
                }
                Text {
                    text: "↻"
                    color: playerController.isRepeat ? accentPink : textSecondary
                    font.pixelSize: 18
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.toggle_repeat()
                    }
                }

                Item { Layout.fillWidth: true }

                // Ползунок таймлайна в нижнем баре
                Text {
                    text: window.formatTime(playerController.position)
                    color: textSecondary
                    font.pixelSize: 10
                }

                Rectangle {
                    Layout.preferredWidth: 220
                    height: 4
                    radius: 2
                    color: "#312741"

                    Rectangle {
                        width: (playerController.duration > 0) ? 
                               (playerController.position / playerController.duration) * parent.width : 0
                        height: parent.height
                        radius: 2
                        color: accentPink
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: (mouse) => {
                            if (playerController.duration > 0) {
                                var pos = (mouse.x / width) * playerController.duration
                                playerController.seek(pos)
                            }
                        }
                    }
                }

                Text {
                    text: window.formatTime(playerController.duration)
                    color: textSecondary
                    font.pixelSize: 10
                }

                // Эквалайзер кнопка
                Text {
                    text: "🎚️"
                    font.pixelSize: 15
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: eqModal.visible = true
                    }
                }

                // Громкость
                Text {
                    text: playerController.volume === 0 ? "🔇" : (playerController.volume > 0.5 ? "🔊" : "🔉")
                    color: textSecondary
                    font.pixelSize: 14
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.set_volume(playerController.volume > 0 ? 0 : 0.8)
                    }
                }

                Rectangle {
                    width: 90
                    height: 4
                    radius: 2
                    color: "#312741"

                    Rectangle {
                        width: playerController.volume * parent.width
                        height: parent.height
                        radius: 2
                        color: accentPink
                    }

                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: (mouse) => {
                            var vol = Math.max(0, Math.min(1, mouse.x / width))
                            playerController.set_volume(vol)
                        }
                    }
                }

                // Полный экран
                Text {
                    text: "⛶"
                    color: textSecondary
                    font.pixelSize: 18
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: window.toggleFullscreen()
                    }
                }
            }
        }
    }

    // Всплывающее окно эквалайзера
    Rectangle {
        id: eqModalBackdrop
        anchors.fill: parent
        color: "#99000000"
        visible: eqModal.visible
        z: 998

        MouseArea {
            anchors.fill: parent
            onClicked: eqModal.visible = false
        }
    }

    EqualizerModal {
        id: eqModal
        anchors.centerIn: parent
        visible: false
        z: 999
        onCloseRequested: eqModal.visible = false
    }
}
