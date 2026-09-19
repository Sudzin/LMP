import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtMultimedia

ApplicationWindow {
    id: window
    visible: true
    width: 1280
    height: 820
    minimumWidth: 980
    minimumHeight: 640
    title: "Aurora Player — " + (playerController.currentTrack.title || "Медиаплеер")
    color: "#0a0712"

    property int currentTab: 0 // 0: Медиатека, 1: Видео, 2: Настройки
    property bool isFullscreen: false
    property string searchQuery: ""

    // Форматирование миллисекунд в MM:SS
    function formatTime(ms) {
        if (!ms || ms <= 0) return "00:00"
        var totalSec = Math.floor(ms / 1000)
        var min = Math.floor(totalSec / 60)
        var sec = totalSec % 60
        return (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec
    }

    // Горячие клавиши
    Shortcut { sequence: "Space"; onActivated: playerController.toggle_play() }
    Shortcut { sequence: "Left"; onActivated: playerController.seek(Math.max(0, playerController.position - 5000)) }
    Shortcut { sequence: "Right"; onActivated: playerController.seek(Math.min(playerController.duration, playerController.position + 5000)) }
    Shortcut { sequence: "Up"; onActivated: playerController.set_volume(playerController.volume + 0.05) }
    Shortcut { sequence: "Down"; onActivated: playerController.set_volume(playerController.volume - 0.05) }
    Shortcut { sequence: "F"; onActivated: toggleFullscreen() }
    Shortcut { sequence: "F11"; onActivated: toggleFullscreen() }

    function toggleFullscreen() {
        if (window.visibility === Window.FullScreen) {
            window.showNormal()
            window.isFullscreen = false
        } else {
            window.showFullScreen()
            window.isFullscreen = true
        }
    }

    // Drag-and-Drop
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

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        // ==========================================
        // ВЕРХНЯЯ ЧАСТЬ: Сайдбар + Основной контент
        // ==========================================
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            // --- 1. Левый Сайдбар (Spotify-стиль) ---
            Rectangle {
                Layout.fillHeight: true
                Layout.preferredWidth: 240
                color: "#110b1a"

                Rectangle {
                    anchors.right: parent.right
                    width: 1
                    height: parent.height
                    color: "#1c132b"
                }

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 18
                    spacing: 16

                    // Логотип
                    RowLayout {
                        spacing: 12
                        Rectangle {
                            width: 38
                            height: 38
                            radius: 10
                            gradient: Gradient {
                                orientation: Gradient.Horizontal
                                GradientStop { position: 0.0; color: "#f43f5e" }
                                GradientStop { position: 1.0; color: "#9333ea" }
                            }
                            Text {
                                anchors.centerIn: parent
                                text: "▶"
                                color: "white"
                                font.pixelSize: 15
                            }
                        }

                        ColumnLayout {
                            spacing: 1
                            Text {
                                text: "AURORA"
                                color: "white"
                                font.pixelSize: 18
                                font.bold: true
                                font.letterSpacing: 1.2
                            }
                            Text {
                                text: "PRO MEDIA PLAYER"
                                color: "#f43f5e"
                                font.pixelSize: 9
                                font.bold: true
                                font.letterSpacing: 1.0
                            }
                        }
                    }

                    // Кнопки добавления контента
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 8

                        Rectangle {
                            Layout.fillWidth: true
                            height: 40
                            radius: 8
                            gradient: Gradient {
                                orientation: Gradient.Horizontal
                                GradientStop { position: 0.0; color: "#f43f5e" }
                                GradientStop { position: 1.0; color: "#be185d" }
                            }
                            Text {
                                anchors.centerIn: parent
                                text: "＋  Открыть файлы"
                                color: "white"
                                font.bold: true
                                font.pixelSize: 13
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.open_file_dialog()
                            }
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 38
                            radius: 8
                            color: openFolderHover.containsMouse ? "#26193b" : "#1a1228"
                            border.color: "#2c1c45"
                            border.width: 1

                            Text {
                                anchors.centerIn: parent
                                text: "📁  Добавить папку"
                                color: "#e2e8f0"
                                font.pixelSize: 12
                                font.bold: true
                            }
                            MouseArea {
                                id: openFolderHover
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.open_folder_dialog()
                            }
                        }
                    }

                    // Разделитель
                    Rectangle {
                        Layout.fillWidth: true
                        height: 1
                        color: "#1e1430"
                    }

                    // Навигационные ссылки
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 4

                        Repeater {
                            model: [
                                { label: "Медиатека", icon: "🎵", idx: 0 },
                                { label: "Видео экран", icon: "🎬", idx: 1 },
                                { label: "Настройки", icon: "⚙️", idx: 2 }
                            ]
                            delegate: Rectangle {
                                Layout.fillWidth: true
                                height: 42
                                radius: 8
                                color: window.currentTab === modelData.idx ? "#241538" : (navHover.containsMouse ? "#181026" : "transparent")

                                Rectangle {
                                    visible: window.currentTab === modelData.idx
                                    width: 3
                                    height: 20
                                    radius: 1.5
                                    color: "#f43f5e"
                                    anchors.left: parent.left
                                    anchors.leftMargin: 4
                                    anchors.verticalCenter: parent.verticalCenter
                                }

                                RowLayout {
                                    anchors.fill: parent
                                    anchors.leftMargin: 16
                                    spacing: 12
                                    Text {
                                        text: modelData.icon
                                        font.pixelSize: 15
                                    }
                                    Text {
                                        text: modelData.label
                                        color: window.currentTab === modelData.idx ? "white" : "#9ca3af"
                                        font.bold: window.currentTab === modelData.idx
                                        font.pixelSize: 13
                                    }
                                }

                                MouseArea {
                                    id: navHover
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: window.currentTab = modelData.idx
                                }
                            }
                        }

                        // Кнопка эквалайзера в сайдбаре
                        Rectangle {
                            Layout.fillWidth: true
                            height: 42
                            radius: 8
                            color: eqBtnHover.containsMouse ? "#181026" : "transparent"

                            RowLayout {
                                anchors.fill: parent
                                anchors.leftMargin: 16
                                spacing: 12
                                Text { text: "🎚️"; font.pixelSize: 15 }
                                Text { text: "Эквалайзер 10-Band"; color: "#9ca3af"; font.pixelSize: 13 }
                            }

                            MouseArea {
                                id: eqBtnHover
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: eqModal.visible = true
                            }
                        }
                    }

                    Item { Layout.fillHeight: true }

                    // Карточка библиотеки внизу сайдбара
                    Rectangle {
                        Layout.fillWidth: true
                        height: 72
                        radius: 10
                        color: "#170f26"
                        border.color: "#25173d"
                        border.width: 1

                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 12
                            spacing: 10

                            Rectangle {
                                width: 36
                                height: 36
                                radius: 8
                                color: "#2b1945"
                                Text {
                                    anchors.centerIn: parent
                                    text: "💿"
                                    font.pixelSize: 18
                                }
                            }

                            ColumnLayout {
                                spacing: 2
                                Text {
                                    text: "В медиатеке"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 12
                                }
                                Text {
                                    text: playerController.tracks.length + " аудио и видео"
                                    color: "#9ca3af"
                                    font.pixelSize: 11
                                }
                            }
                        }
                    }
                }
            }

            // --- 2. Основная рабочая область ---
            StackLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                currentIndex: window.currentTab

                // === ВКЛАДКА 0: МЕДИАТЕКА ===
                Rectangle {
                    color: "#0c0816"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 24
                        spacing: 16

                        // Баннер Hero в стиле Spotify
                        Rectangle {
                            Layout.fillWidth: true
                            height: 120
                            radius: 16
                            clip: true
                            gradient: Gradient {
                                orientation: Gradient.Horizontal
                                GradientStop { position: 0.0; color: "#2d1345" }
                                GradientStop { position: 0.6; color: "#1b0f2e" }
                                GradientStop { position: 1.0; color: "#130a21" }
                            }
                            border.color: "#381c57"
                            border.width: 1

                            RowLayout {
                                anchors.fill: parent
                                anchors.margins: 20
                                spacing: 20

                                // Большая иконка коллекции
                                Rectangle {
                                    width: 80
                                    height: 80
                                    radius: 12
                                    gradient: Gradient {
                                        orientation: Gradient.TopToBottom
                                        GradientStop { position: 0.0; color: "#f43f5e" }
                                        GradientStop { position: 1.0; color: "#7c3aed" }
                                    }
                                    Text {
                                        anchors.centerIn: parent
                                        text: "🎧"
                                        font.pixelSize: 36
                                    }
                                }

                                ColumnLayout {
                                    spacing: 4
                                    Text {
                                        text: "ЛОКАЛЬНАЯ КОЛЛЕКЦИЯ"
                                        color: "#f43f5e"
                                        font.bold: true
                                        font.pixelSize: 11
                                        font.letterSpacing: 1.2
                                    }
                                    Text {
                                        text: "Мои треки и медиа"
                                        color: "white"
                                        font.bold: true
                                        font.pixelSize: 26
                                    }
                                    Text {
                                        text: playerController.tracks.length + " файлов • Высокое качество звука (FLAC, MP3, WAV, MP4)"
                                        color: "#9ca3af"
                                        font.pixelSize: 12
                                    }
                                }

                                Item { Layout.fillWidth: true }

                                // Поле быстрого поиска
                                Rectangle {
                                    width: 260
                                    height: 40
                                    radius: 20
                                    color: "#180f26"
                                    border.color: searchInput.activeFocus ? "#f43f5e" : "#2d1b45"
                                    border.width: 1

                                    RowLayout {
                                        anchors.fill: parent
                                        anchors.leftMargin: 14
                                        anchors.rightMargin: 14
                                        spacing: 8

                                        Text { text: "🔍"; font.pixelSize: 13 }

                                        TextInput {
                                            id: searchInput
                                            Layout.fillWidth: true
                                            color: "white"
                                            font.pixelSize: 12
                                            clip: true
                                            onTextChanged: window.searchQuery = text.toLowerCase()

                                            Text {
                                                text: "Поиск по трекам..."
                                                color: "#6b7280"
                                                font.pixelSize: 12
                                                visible: !searchInput.text && !searchInput.activeFocus
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // СТРОГАЯ ШАПКА ТАБЛИЦЫ
                        Rectangle {
                            id: tableHeader
                            Layout.fillWidth: true
                            height: 38
                            color: "#120b1f"
                            radius: 6

                            property real availableWidth: tableHeader.width - 320
                            property real titleColW: Math.max(160, availableWidth * 0.40)
                            property real artistColW: Math.max(120, availableWidth * 0.30)
                            property real albumColW: Math.max(100, availableWidth * 0.30)

                            Item {
                                anchors.fill: parent

                                Text {
                                    x: 16
                                    width: 34
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: "#"
                                    color: "#6b7280"
                                    font.bold: true
                                    font.pixelSize: 11
                                }

                                Text {
                                    x: 108
                                    width: tableHeader.titleColW
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: "НАЗВАНИЕ"
                                    color: "#6b7280"
                                    font.bold: true
                                    font.pixelSize: 11
                                }

                                Text {
                                    x: 108 + tableHeader.titleColW + 12
                                    width: tableHeader.artistColW
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: "ИСПОЛНИТЕЛЬ"
                                    color: "#6b7280"
                                    font.bold: true
                                    font.pixelSize: 11
                                }

                                Text {
                                    x: 108 + tableHeader.titleColW + 12 + tableHeader.artistColW + 12
                                    width: tableHeader.albumColW
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: "АЛЬБОМ"
                                    color: "#6b7280"
                                    font.bold: true
                                    font.pixelSize: 11
                                }

                                Text {
                                    x: parent.width - 130
                                    width: 50
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: "ДЛИТ."
                                    color: "#6b7280"
                                    font.bold: true
                                    font.pixelSize: 11
                                    horizontalAlignment: Text.AlignRight
                                }

                                Text {
                                    x: parent.width - 76
                                    width: 60
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: "ДЕЙСТВИЯ"
                                    color: "#6b7280"
                                    font.bold: true
                                    font.pixelSize: 11
                                    horizontalAlignment: Text.AlignHCenter
                                }
                            }
                        }

                        // СПИСОК ТРЕКОВ
                        ListView {
                            id: tracksListView
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            clip: true
                            spacing: 4
                            model: playerController.tracks

                            delegate: Rectangle {
                                id: trackRow
                                width: tracksListView.width
                                radius: 8

                                property bool isCurrent: (playerController.currentTrack.file_path === modelData.file_path)
                                property bool matchesSearch: (window.searchQuery === "" || 
                                    (modelData.title && modelData.title.toLowerCase().indexOf(window.searchQuery) !== -1) ||
                                    (modelData.artist && modelData.artist.toLowerCase().indexOf(window.searchQuery) !== -1))

                                visible: matchesSearch
                                height: matchesSearch ? 56 : 0

                                color: {
                                    if (isCurrent) return "#221136"
                                    if (rowArea.containsMouse) return "#170f24"
                                    return "transparent"
                                }
                                border.color: isCurrent ? "#4a2473" : "transparent"
                                border.width: 1

                                property real availableWidth: trackRow.width - 320
                                property real titleColW: Math.max(160, availableWidth * 0.40)
                                property real artistColW: Math.max(120, availableWidth * 0.30)
                                property real albumColW: Math.max(100, availableWidth * 0.30)

                                MouseArea {
                                    id: rowArea
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onDoubleClicked: {
                                        playerController.play_track(index)
                                        if (modelData.is_video) {
                                            window.currentTab = 1
                                        }
                                    }
                                }

                                // 1. Номер трека или статус Play / Анимированный визуализатор
                                Item {
                                    x: 16
                                    width: 34
                                    anchors.verticalCenter: parent.verticalCenter

                                    Text {
                                        anchors.centerIn: parent
                                        visible: !(trackRow.isCurrent && playerController.isPlaying) && !rowArea.containsMouse
                                        text: index + 1
                                        color: trackRow.isCurrent ? "#f43f5e" : "#9ca3af"
                                        font.pixelSize: 12
                                        font.bold: trackRow.isCurrent
                                    }

                                    // Кнопка Play при наведении
                                    Text {
                                        anchors.centerIn: parent
                                        visible: rowArea.containsMouse && !(trackRow.isCurrent && playerController.isPlaying)
                                        text: "▶"
                                        color: "white"
                                        font.pixelSize: 13
                                    }

                                    // Анимированный визуализатор если трек играет
                                    VisualizerMini {
                                        anchors.centerIn: parent
                                        visible: trackRow.isCurrent && playerController.isPlaying
                                        isPlaying: true
                                    }
                                }

                                // 2. Обложка миниатюра (Cover Art)
                                Rectangle {
                                    x: 58
                                    width: 40
                                    height: 40
                                    radius: 6
                                    anchors.verticalCenter: parent.verticalCenter
                                    color: "#28193f"
                                    clip: true

                                    Image {
                                        anchors.fill: parent
                                        source: modelData.cover_url || ""
                                        fillMode: Image.PreserveAspectCrop
                                        visible: modelData.cover_url !== ""
                                    }

                                    // Фоллбек иконка если нет обложки
                                    Text {
                                        anchors.centerIn: parent
                                        visible: !modelData.cover_url
                                        text: modelData.is_video ? "🎬" : "🎵"
                                        font.pixelSize: 16
                                    }
                                }

                                // 3. Название + бейдж
                                RowLayout {
                                    x: 108
                                    width: trackRow.titleColW
                                    anchors.verticalCenter: parent.verticalCenter
                                    spacing: 8

                                    Text {
                                        text: modelData.title || "Без названия"
                                        color: trackRow.isCurrent ? "#f43f5e" : "white"
                                        font.bold: trackRow.isCurrent
                                        font.pixelSize: 13
                                        elide: Text.ElideRight
                                        Layout.fillWidth: true
                                    }

                                    Rectangle {
                                        visible: modelData.is_video
                                        width: 42
                                        height: 18
                                        radius: 4
                                        gradient: Gradient {
                                            orientation: Gradient.Horizontal
                                            GradientStop { position: 0.0; color: "#8b5cf6" }
                                            GradientStop { position: 1.0; color: "#6366f1" }
                                        }
                                        Text {
                                            anchors.centerIn: parent
                                            text: "VIDEO"
                                            color: "white"
                                            font.pixelSize: 9
                                            font.bold: true
                                        }
                                    }
                                }

                                // 4. Исполнитель
                                Text {
                                    x: 108 + trackRow.titleColW + 12
                                    width: trackRow.artistColW
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: modelData.artist || "—"
                                    color: trackRow.isCurrent ? "#e2e8f0" : "#9ca3af"
                                    font.pixelSize: 12
                                    elide: Text.ElideRight
                                }

                                // 5. Альбом
                                Text {
                                    x: 108 + trackRow.titleColW + 12 + trackRow.artistColW + 12
                                    width: trackRow.albumColW
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: modelData.album || "—"
                                    color: "#6b7280"
                                    font.pixelSize: 12
                                    elide: Text.ElideRight
                                }

                                // 6. Длительность
                                Text {
                                    x: parent.width - 130
                                    width: 50
                                    anchors.verticalCenter: parent.verticalCenter
                                    text: window.formatTime(modelData.duration * 1000)
                                    color: "#9ca3af"
                                    font.pixelSize: 12
                                    horizontalAlignment: Text.AlignRight
                                }

                                // 7. Действия (Избранное + Удалить)
                                RowLayout {
                                    x: parent.width - 76
                                    width: 60
                                    anchors.verticalCenter: parent.verticalCenter
                                    spacing: 8
                                    Layout.alignment: Qt.AlignHCenter

                                    Rectangle {
                                        width: 26
                                        height: 26
                                        radius: 13
                                        color: favHover.containsMouse ? "#2d1d45" : "transparent"
                                        Text {
                                            anchors.centerIn: parent
                                            text: modelData.is_favorite ? "♥" : "♡"
                                            color: modelData.is_favorite ? "#f43f5e" : "#6b7280"
                                            font.pixelSize: 15
                                        }
                                        MouseArea {
                                            id: favHover
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            cursorShape: Qt.PointingHandCursor
                                            onClicked: playerController.toggle_favorite(index)
                                        }
                                    }

                                    Rectangle {
                                        width: 26
                                        height: 26
                                        radius: 13
                                        color: delHover.containsMouse ? "#3b1624" : "transparent"
                                        Text {
                                            anchors.centerIn: parent
                                            text: "✕"
                                            color: delHover.containsMouse ? "#f43f5e" : "#6b7280"
                                            font.pixelSize: 13
                                        }
                                        MouseArea {
                                            id: delHover
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            cursorShape: Qt.PointingHandCursor
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

                                Rectangle {
                                    width: 70
                                    height: 70
                                    radius: 35
                                    color: "#1d122e"
                                    Layout.alignment: Qt.AlignHCenter
                                    Text {
                                        anchors.centerIn: parent
                                        text: "🎵"
                                        font.pixelSize: 32
                                    }
                                }

                                Text {
                                    text: "В медиатеке пока нет треков"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 18
                                    Layout.alignment: Qt.AlignHCenter
                                }

                                Text {
                                    text: "Перетащите ваши MP3, FLAC или видеофайлы в это окно или выберите их"
                                    color: "#9ca3af"
                                    font.pixelSize: 13
                                    Layout.alignment: Qt.AlignHCenter
                                }

                                Rectangle {
                                    Layout.alignment: Qt.AlignHCenter
                                    width: 200
                                    height: 42
                                    radius: 8
                                    color: "#f43f5e"
                                    Text {
                                        anchors.centerIn: parent
                                        text: "Выбрать на компьютере"
                                        color: "white"
                                        font.bold: true
                                        font.pixelSize: 13
                                    }
                                    MouseArea {
                                        anchors.fill: parent
                                        cursorShape: Qt.PointingHandCursor
                                        onClicked: playerController.open_file_dialog()
                                    }
                                }
                            }
                        }
                    }
                }

                // === ВКЛАДКА 1: ВИДЕО ЭКРАН ===
                Rectangle {
                    color: "black"

                    VideoOutput {
                        id: videoOutput
                        anchors.fill: parent

                        Component.onCompleted: {
                            playerController.set_video_sink(videoOutput.videoSink)
                        }
                    }

                    // Оверлей если видео не выбрано
                    ColumnLayout {
                        anchors.centerIn: parent
                        visible: !playerController.currentTrack.is_video
                        spacing: 12

                        Rectangle {
                            width: 64
                            height: 64
                            radius: 32
                            color: "#1f1430"
                            Layout.alignment: Qt.AlignHCenter
                            Text {
                                anchors.centerIn: parent
                                text: "🎬"
                                font.pixelSize: 28
                            }
                        }

                        Text {
                            text: "Видео экран готов"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 18
                            Layout.alignment: Qt.AlignHCenter
                        }
                        Text {
                            text: "Дважды кликните на видеофайл в медиатеке для просмотра"
                            color: "#9ca3af"
                            font.pixelSize: 13
                            Layout.alignment: Qt.AlignHCenter
                        }
                    }
                }

                // === ВКЛАДКА 2: НАСТРОЙКИ ===
                Rectangle {
                    color: "#0a0712"

                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: 30
                        spacing: 20

                        Text {
                            text: "Настройки приложения"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 22
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 200
                            radius: 12
                            color: "#130c1f"
                            border.color: "#211536"
                            border.width: 1

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 20
                                spacing: 10

                                Text {
                                    text: "Горячие клавиши (Keyboard Shortcuts):"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 15
                                }
                                Text { text: "• Space — Воспроизведение / Пауза"; color: "#cbd5e1"; font.pixelSize: 13 }
                                Text { text: "• ← / → — Перемотка на 5 сек назад / вперед"; color: "#cbd5e1"; font.pixelSize: 13 }
                                Text { text: "• ↑ / ↓ — Регулировка громкости ±5%"; color: "#cbd5e1"; font.pixelSize: 13 }
                                Text { text: "• F или F11 — Переключение полноэкранного режима"; color: "#cbd5e1"; font.pixelSize: 13 }
                            }
                        }

                        Rectangle {
                            Layout.fillWidth: true
                            height: 120
                            radius: 12
                            color: "#130c1f"
                            border.color: "#211536"
                            border.width: 1

                            ColumnLayout {
                                anchors.fill: parent
                                anchors.margins: 20
                                spacing: 8

                                Text {
                                    text: "О Aurora Player:"
                                    color: "white"
                                    font.bold: true
                                    font.pixelSize: 15
                                }
                                Text { text: "Версия: 1.0.0 Pro Desktop • Движок: Qt 6.7 Multimedia FFmpeg • SQLite База данных"; color: "#9ca3af"; font.pixelSize: 12 }
                                Text { text: "Офлайн-плеер без телеметрии и слежки. Ваша музыка принадлежит только вам."; color: "#6b7280"; font.pixelSize: 12 }
                            }
                        }

                        Item { Layout.fillHeight: true }
                    }
                }
            }
        }

        // ==========================================
        // 3. НИЖНЯЯ ПАНЕЛЬ ВОСПРОИЗВЕДЕНИЯ (PLAYER BAR)
        // ==========================================
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 90
            color: "#0e0917"

            Rectangle {
                anchors.top: parent.top
                width: parent.width
                height: 1
                color: "#1c122b"
            }

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 24
                anchors.rightMargin: 24
                spacing: 20

                // 1. Слева: Информация о текущем треке
                RowLayout {
                    Layout.preferredWidth: 280
                    spacing: 14

                    // Обложка текущего трека
                    Rectangle {
                        width: 54
                        height: 54
                        radius: 8
                        color: "#211438"
                        clip: true

                        Image {
                            anchors.fill: parent
                            source: playerController.currentTrack.cover_url || ""
                            fillMode: Image.PreserveAspectCrop
                            visible: playerController.currentTrack.cover_url !== ""
                        }

                        Rectangle {
                            anchors.fill: parent
                            visible: !playerController.currentTrack.cover_url
                            gradient: Gradient {
                                orientation: Gradient.TopToBottom
                                GradientStop { position: 0.0; color: "#e11d48" }
                                GradientStop { position: 1.0; color: "#6d28d9" }
                            }
                            Text {
                                anchors.centerIn: parent
                                text: playerController.currentTrack.is_video ? "🎬" : "🎵"
                                font.pixelSize: 22
                            }
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 2

                        Text {
                            text: playerController.currentTrack.title || "Нет трека"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 14
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }

                        Text {
                            text: playerController.currentTrack.artist || "Выберите файл для прослушивания"
                            color: "#9ca3af"
                            font.pixelSize: 12
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }
                    }

                    // Кнопка Лайк
                    Rectangle {
                        width: 32
                        height: 32
                        radius: 16
                        color: heartHover.containsMouse ? "#221438" : "transparent"
                        Text {
                            anchors.centerIn: parent
                            text: playerController.currentTrack.is_favorite ? "♥" : "♡"
                            color: playerController.currentTrack.is_favorite ? "#f43f5e" : "#9ca3af"
                            font.pixelSize: 16
                        }
                        MouseArea {
                            id: heartHover
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                if (playerController.currentIndex >= 0) {
                                    playerController.toggle_favorite(playerController.currentIndex)
                                }
                            }
                        }
                    }
                }

                // 2. По центру: Кнопки воспроизведения + Таймлайн
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4

                    // Кнопки управления (Shuffle, Prev, Play, Next, Repeat)
                    RowLayout {
                        Layout.alignment: Qt.AlignHCenter
                        spacing: 20

                        // Shuffle
                        Rectangle {
                            width: 30
                            height: 30
                            radius: 15
                            color: "transparent"
                            Text {
                                anchors.centerIn: parent
                                text: "🔀"
                                color: playerController.isShuffle ? "#f43f5e" : "#6b7280"
                                font.pixelSize: 14
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.toggle_shuffle()
                            }
                        }

                        // Previous
                        Rectangle {
                            width: 32
                            height: 32
                            radius: 16
                            color: prevHover.containsMouse ? "#24163b" : "transparent"
                            Text {
                                anchors.centerIn: parent
                                text: "⏮"
                                color: "white"
                                font.pixelSize: 16
                            }
                            MouseArea {
                                id: prevHover
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.previous_track()
                            }
                        }

                        // Play/Pause круг
                        Rectangle {
                            width: 42
                            height: 42
                            radius: 21
                            color: playHover.containsMouse ? "#fb7185" : "#f43f5e"

                            Text {
                                anchors.centerIn: parent
                                text: playerController.isPlaying ? "❚❚" : "▶"
                                color: "white"
                                font.pixelSize: 15
                            }

                            MouseArea {
                                id: playHover
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.toggle_play()
                            }
                        }

                        // Next
                        Rectangle {
                            width: 32
                            height: 32
                            radius: 16
                            color: nextHover.containsMouse ? "#24163b" : "transparent"
                            Text {
                                anchors.centerIn: parent
                                text: "⏭"
                                color: "white"
                                font.pixelSize: 16
                            }
                            MouseArea {
                                id: nextHover
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.next_track()
                            }
                        }

                        // Repeat
                        Rectangle {
                            width: 30
                            height: 30
                            radius: 15
                            color: "transparent"
                            Text {
                                anchors.centerIn: parent
                                text: "🔁"
                                color: playerController.isRepeat ? "#f43f5e" : "#6b7280"
                                font.pixelSize: 14
                            }
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: playerController.toggle_repeat()
                            }
                        }
                    }

                    // Таймлайн (Seek Bar)
                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 12

                        Text {
                            text: window.formatTime(playerController.position)
                            color: "#9ca3af"
                            font.pixelSize: 11
                            font.bold: true
                            Layout.preferredWidth: 42
                            horizontalAlignment: Text.AlignRight
                        }

                        AuroraSlider {
                            id: timelineSlider
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
                            font.bold: true
                            Layout.preferredWidth: 42
                        }
                    }
                }

                // 3. Справа: Эквалайзер, Громкость, Fullscreen
                RowLayout {
                    Layout.preferredWidth: 240
                    spacing: 12
                    Layout.alignment: Qt.AlignRight

                    // Кнопка вызова эквалайзера
                    Rectangle {
                        width: 34
                        height: 34
                        radius: 8
                        color: eqIconHover.containsMouse ? "#221438" : "transparent"
                        Text {
                            anchors.centerIn: parent
                            text: "🎚️"
                            font.pixelSize: 16
                        }
                        MouseArea {
                            id: eqIconHover
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: eqModal.visible = !eqModal.visible
                        }
                    }

                    // Иконка громкости
                    Text {
                        text: playerController.volume === 0 ? "🔇" : (playerController.volume < 0.5 ? "🔉" : "🔊")
                        font.pixelSize: 14
                    }

                    // Кастомный ползунок громкости
                    AuroraSlider {
                        id: volSlider
                        Layout.preferredWidth: 90
                        from: 0.0
                        to: 1.0
                        value: playerController.volume
                        onMoved: {
                            playerController.set_volume(value)
                        }
                    }

                    // Полноэкранный режим
                    Rectangle {
                        width: 34
                        height: 34
                        radius: 8
                        color: fsHover.containsMouse ? "#221438" : "transparent"
                        Text {
                            anchors.centerIn: parent
                            text: window.isFullscreen ? "🗗" : "⛶"
                            color: "white"
                            font.pixelSize: 16
                        }
                        MouseArea {
                            id: fsHover
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: window.toggleFullscreen()
                        }
                    }
                }
            }
        }
    }

    // ==========================================
    // МОДАЛЬНОЕ ОКНО ЭКВАЛАЙЗЕРА
    // ==========================================
    Rectangle {
        id: eqModal
        anchors.fill: parent
        color: "#b3000000"
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
