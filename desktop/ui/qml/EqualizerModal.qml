import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: eqRoot
    width: 720
    height: 460
    radius: 18
    color: "#160f24"
    border.color: "#2f1f45"
    border.width: 1

    signal closeRequested()

    readonly property var freqLabels: ["31", "62", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"]
    readonly property var presets: ["Flat", "Rock", "Pop", "Jazz", "Electronic", "Bass Boost"]

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 18

        // Заголовок
        RowLayout {
            Layout.fillWidth: true

            RowLayout {
                spacing: 10
                Rectangle {
                    width: 30
                    height: 30
                    radius: 8
                    color: "#2a1b3d"
                    Text {
                        anchors.centerIn: parent
                        text: "🎚️"
                        font.pixelSize: 14
                    }
                }
                ColumnLayout {
                    spacing: 1
                    Text {
                        text: "10-полосный эквалайзер"
                        color: "white"
                        font.bold: true
                        font.pixelSize: 17
                    }
                    Text {
                        text: "Аппаратная регулировка полос частот (±12 dB)"
                        color: "#9ca3af"
                        font.pixelSize: 11
                    }
                }
            }

            Item { Layout.fillWidth: true }

            Rectangle {
                width: 32
                height: 32
                radius: 16
                color: closeHoverArea.containsMouse ? "#2d1f42" : "transparent"
                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    color: "#9ca3af"
                    font.pixelSize: 15
                }
                MouseArea {
                    id: closeHoverArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: eqRoot.closeRequested()
                }
            }
        }

        // Пресеты
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Text {
                text: "Пресеты:"
                color: "#9ca3af"
                font.pixelSize: 12
                font.bold: true
            }

            Repeater {
                model: eqRoot.presets
                delegate: Rectangle {
                    height: 30
                    radius: 6
                    color: presetArea.containsMouse ? "#3b255c" : "#24163b"
                    border.color: "#3f2863"
                    border.width: 1
                    implicitWidth: presetText.implicitWidth + 20

                    Text {
                        id: presetText
                        anchors.centerIn: parent
                        text: modelData
                        color: "white"
                        font.pixelSize: 11
                        font.bold: true
                    }

                    MouseArea {
                        id: presetArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: playerController.set_equalizer_preset(modelData)
                    }
                }
            }
        }

        // 10 Полос
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 14

            Repeater {
                model: 10
                delegate: ColumnLayout {
                    Layout.fillHeight: true
                    Layout.fillWidth: true
                    spacing: 8

                    // Значение dB
                    Text {
                        text: (playerController.equalizerBands[index] > 0 ? "+" : "") + 
                              playerController.equalizerBands[index].toFixed(1)
                        color: Math.abs(playerController.equalizerBands[index]) > 0.1 ? "#f43f5e" : "#6b7280"
                        font.pixelSize: 10
                        font.bold: true
                        Layout.alignment: Qt.AlignHCenter
                    }

                    // Кастомный вертикальный слайдер
                    Slider {
                        id: bandSlider
                        Layout.fillHeight: true
                        Layout.alignment: Qt.AlignHCenter
                        orientation: Qt.Vertical
                        from: -12.0
                        to: 12.0
                        stepSize: 0.5
                        value: playerController.equalizerBands[index] !== undefined ? playerController.equalizerBands[index] : 0.0

                        background: Rectangle {
                            x: bandSlider.leftPadding + bandSlider.availableWidth / 2 - width / 2
                            y: bandSlider.topPadding
                            implicitWidth: 4
                            implicitHeight: 180
                            width: implicitWidth
                            height: bandSlider.availableHeight
                            radius: 2
                            color: "#281a3d"

                            // Центральная линия 0 dB
                            Rectangle {
                                anchors.centerIn: parent
                                width: 14
                                height: 1
                                color: "#4d3470"
                            }
                        }

                        handle: Rectangle {
                            x: bandSlider.leftPadding + bandSlider.availableWidth / 2 - width / 2
                            y: bandSlider.topPadding + (1.0 - bandSlider.visualPosition) * (bandSlider.availableHeight - height)
                            implicitWidth: 16
                            implicitHeight: 16
                            radius: 8
                            color: bandSlider.pressed ? "#f43f5e" : "#e2e8f0"
                            border.color: "#f43f5e"
                            border.width: bandSlider.hovered ? 2 : 1
                        }

                        onMoved: {
                            playerController.set_equalizer_band(index, value)
                        }
                    }

                    // Название частоты
                    Text {
                        text: eqRoot.freqLabels[index]
                        color: "#9ca3af"
                        font.pixelSize: 11
                        font.bold: true
                        Layout.alignment: Qt.AlignHCenter
                    }
                }
            }
        }

        // Нижняя панель действий
        RowLayout {
            Layout.fillWidth: true
            Item { Layout.fillWidth: true }

            Rectangle {
                width: 140
                height: 36
                radius: 8
                color: "#27183e"
                border.color: "#3f2863"
                Text {
                    anchors.centerIn: parent
                    text: "Сбросить в ноль"
                    color: "#cbd5e1"
                    font.pixelSize: 12
                }
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: playerController.set_equalizer_preset("Flat")
                }
            }

            Rectangle {
                width: 110
                height: 36
                radius: 8
                color: "#f43f5e"
                Text {
                    anchors.centerIn: parent
                    text: "Применить"
                    color: "white"
                    font.bold: true
                    font.pixelSize: 12
                }
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: eqRoot.closeRequested()
                }
            }
        }
    }
}
