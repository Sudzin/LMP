import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: eqRoot
    width: 680
    height: 440
    radius: 16
    color: "#16121c"
    border.color: "#33ffffff"
    border.width: 1

    signal closeRequested()

    readonly property var freqLabels: ["31", "62", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"]
    readonly property var presets: ["Flat", "Rock", "Pop", "Jazz", "Electronic", "Bass Boost"]

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 20
        spacing: 16

        // Header
        RowLayout {
            Layout.fillWidth: true

            Text {
                text: "10-полосный эквалайзер (±12 dB)"
                color: "white"
                font.bold: true
                font.pixelSize: 18
            }

            Item { Layout.fillWidth: true }

            Button {
                text: "✕"
                background: Rectangle { color: "transparent" }
                contentItem: Text {
                    text: "✕"
                    color: "#a3a3a3"
                    font.pixelSize: 16
                    horizontalAlignment: Text.AlignHCenter
                }
                onClicked: eqRoot.closeRequested()
            }
        }

        // Presets
        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Text {
                text: "Пресеты:"
                color: "#a3a3a3"
                font.pixelSize: 12
            }

            Repeater {
                model: eqRoot.presets
                delegate: Button {
                    text: modelData
                    background: Rectangle {
                        color: "#22ffffff"
                        radius: 8
                        border.color: "#33ffffff"
                    }
                    contentItem: Text {
                        text: modelData
                        color: "white"
                        font.pixelSize: 11
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                    }
                    onClicked: playerController.set_equalizer_preset(modelData)
                }
            }
        }

        // 10 Sliders
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 12

            Repeater {
                model: 10
                delegate: ColumnLayout {
                    Layout.fillHeight: true
                    Layout.fillWidth: true
                    spacing: 6

                    Text {
                        text: (playerController.equalizerBands[index] > 0 ? "+" : "") + 
                              playerController.equalizerBands[index].toFixed(1) + " dB"
                        color: "#f43f5e"
                        font.pixelSize: 10
                        font.bold: true
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Slider {
                        id: bandSlider
                        Layout.fillHeight: true
                        Layout.alignment: Qt.AlignHCenter
                        orientation: Qt.Vertical
                        from: -12.0
                        to: 12.0
                        stepSize: 0.5
                        value: playerController.equalizerBands[index] !== undefined ? playerController.equalizerBands[index] : 0.0

                        onMoved: {
                            playerController.set_equalizer_band(index, value)
                        }
                    }

                    Text {
                        text: eqRoot.freqLabels[index]
                        color: "#a3a3a3"
                        font.pixelSize: 11
                        Layout.alignment: Qt.AlignHCenter
                    }
                }
            }
        }

        // Footer
        RowLayout {
            Layout.fillWidth: true
            Item { Layout.fillWidth: true }

            Button {
                text: "Сбросить в ноль"
                background: Rectangle {
                    color: "#22ffffff"
                    radius: 8
                }
                contentItem: Text {
                    text: "Сбросить в ноль"
                    color: "white"
                    font.pixelSize: 12
                }
                onClicked: playerController.set_equalizer_preset("Flat")
            }

            Button {
                text: "Закрыть"
                background: Rectangle {
                    color: "#f43f5e"
                    radius: 8
                }
                contentItem: Text {
                    text: "Закрыть"
                    color: "white"
                    font.pixelSize: 12
                    font.bold: true
                }
                onClicked: eqRoot.closeRequested()
            }
        }
    }
}
