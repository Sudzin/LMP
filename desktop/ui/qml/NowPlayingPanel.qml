import QtQuick
import QtQuick.Layouts

Rectangle {
    id: panelRoot
    width: 280
    color: "#100a1c"
    border.color: "#1d122f"
    border.width: 1

    property var currentTrack: playerController.currentTrack
    property bool isPlaying: playerController.isPlaying

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 18
        spacing: 16

        // Верхний заголовок
        RowLayout {
            Layout.fillWidth: true
            Text {
                text: "СЕЙЧАС ИГРАЕТ"
                color: "#f43f5e"
                font.bold: true
                font.pixelSize: 10
                font.letterSpacing: 1.2
            }
            Item { Layout.fillWidth: true }
            Text {
                text: panelRoot.isPlaying ? "АКТИВНО" : "ПАУЗА"
                color: panelRoot.isPlaying ? "#34d399" : "#9ca3af"
                font.bold: true
                font.pixelSize: 10
            }
        }

        // Большая виниловая пластинка / обложка
        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: 240
            Layout.alignment: Qt.AlignHCenter

            // Крутящийся винил
            Rectangle {
                id: vinylDisc
                width: 220
                height: 220
                radius: 110
                anchors.centerIn: parent
                color: "#0a0710"
                border.color: "#2a1b40"
                border.width: 4

                // Виниловые канавки (концентрические круги)
                Rectangle {
                    anchors.centerIn: parent
                    width: 190; height: 190; radius: 95
                    color: "transparent"; border.color: "#181026"; border.width: 1
                }
                Rectangle {
                    anchors.centerIn: parent
                    width: 160; height: 160; radius: 80
                    color: "transparent"; border.color: "#1f1530"; border.width: 1
                }
                Rectangle {
                    anchors.centerIn: parent
                    width: 130; height: 130; radius: 65
                    color: "transparent"; border.color: "#26193b"; border.width: 1
                }

                // Центральная обложка трека
                Rectangle {
                    anchors.centerIn: parent
                    width: 100
                    height: 100
                    radius: 50
                    color: "#2d1645"
                    clip: true

                    Image {
                        anchors.fill: parent
                        source: panelRoot.currentTrack.cover_url || ""
                        fillMode: Image.PreserveAspectCrop
                        visible: panelRoot.currentTrack.cover_url !== ""
                    }

                    // Заглушка если обложки нет
                    Rectangle {
                        anchors.fill: parent
                        visible: !panelRoot.currentTrack.cover_url
                        gradient: Gradient {
                            orientation: Gradient.TopToBottom
                            GradientStop { position: 0.0; color: "#f43f5e" }
                            GradientStop { position: 1.0; color: "#7c3aed" }
                        }
                        Text {
                            anchors.centerIn: parent
                            text: "🎵"
                            font.pixelSize: 32
                        }
                    }

                    // Центральное отверстие пластинки
                    Rectangle {
                        anchors.centerIn: parent
                        width: 16
                        height: 16
                        radius: 8
                        color: "#0a0710"
                        border.color: "#f43f5e"
                        border.width: 1
                    }
                }

                // Анимация плавного вращения пластинки при воспроизведении
                RotationAnimation on rotation {
                    running: panelRoot.isPlaying
                    loops: Animation.Infinite
                    from: 0
                    to: 360
                    duration: 12000
                }
            }
        }

        // Информация о текущем треке
        ColumnLayout {
            Layout.fillWidth: true
            spacing: 3

            Text {
                text: panelRoot.currentTrack.title || "Нет активного трека"
                color: "white"
                font.bold: true
                font.pixelSize: 15
                elide: Text.ElideRight
                Layout.fillWidth: true
            }

            Text {
                text: panelRoot.currentTrack.artist || "Неизвестный исполнитель"
                color: "#e2e8f0"
                font.pixelSize: 13
                elide: Text.ElideRight
                Layout.fillWidth: true
            }

            Text {
                text: panelRoot.currentTrack.album || "Неизвестный альбом"
                color: "#9ca3af"
                font.pixelSize: 11
                elide: Text.ElideRight
                Layout.fillWidth: true
            }
        }

        // Карточка параметров аудио (High-Res Audio Specs)
        Rectangle {
            Layout.fillWidth: true
            height: 90
            radius: 12
            color: "#160e26"
            border.color: "#281742"
            border.width: 1

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 12
                spacing: 8

                RowLayout {
                    Layout.fillWidth: true
                    Text { text: "Формат"; color: "#9ca3af"; font.pixelSize: 11 }
                    Item { Layout.fillWidth: true }
                    Rectangle {
                        height: 18
                        radius: 4
                        color: "#f43f5e"
                        implicitWidth: formatText.implicitWidth + 12
                        Text {
                            id: formatText
                            anchors.centerIn: parent
                            text: panelRoot.currentTrack.file_path ? 
                                  panelRoot.currentTrack.file_path.split('.').pop().toUpperCase() : "AUDIO"
                            color: "white"
                            font.bold: true
                            font.pixelSize: 9
                        }
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    Text { text: "Качество"; color: "#9ca3af"; font.pixelSize: 11 }
                    Item { Layout.fillWidth: true }
                    Text { text: "Lossless / 320 kbps"; color: "#cbd5e1"; font.pixelSize: 11; font.bold: true }
                }

                RowLayout {
                    Layout.fillWidth: true
                    Text { text: "Частота"; color: "#9ca3af"; font.pixelSize: 11 }
                    Item { Layout.fillWidth: true }
                    Text { text: "44.1 kHz • 24-bit"; color: "#cbd5e1"; font.pixelSize: 11; font.bold: true }
                }
            }
        }

        // Интерактивный Live-спектроанализатор
        Rectangle {
            Layout.fillWidth: true
            height: 70
            radius: 12
            color: "#140c24"
            border.color: "#25153f"
            border.width: 1

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 10
                spacing: 6

                RowLayout {
                    Layout.fillWidth: true
                    Text { text: "Спектрограмма (FFT)"; color: "#9ca3af"; font.pixelSize: 10; font.bold: true }
                    Item { Layout.fillWidth: true }
                    Text { text: "10 Bands"; color: "#f43f5e"; font.pixelSize: 9; font.bold: true }
                }

                Row {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    spacing: 5
                    anchors.horizontalCenter: parent.horizontalCenter

                    Repeater {
                        model: 12
                        delegate: Rectangle {
                            id: specBar
                            width: 14
                            height: panelRoot.isPlaying ? 8 + Math.random() * 26 : 4
                            radius: 2
                            color: Qt.rgba(0.95, 0.25 + index * 0.05, 0.45 + index * 0.04, 0.9)
                            anchors.bottom: parent.bottom

                            SequentialAnimation on height {
                                running: panelRoot.isPlaying
                                loops: Animation.Infinite
                                NumberAnimation {
                                    to: 6 + ((index * 7 + 5) % 28)
                                    duration: 180 + (index * 40)
                                    easing.type: Easing.InOutQuad
                                }
                                NumberAnimation {
                                    to: 4
                                    duration: 160 + (index * 30)
                                    easing.type: Easing.InOutQuad
                                }
                            }
                        }
                    }
                }
            }
        }

        Item { Layout.fillHeight: true }
    }
}
