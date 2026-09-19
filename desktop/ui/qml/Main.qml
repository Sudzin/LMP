import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

ApplicationWindow {
    id: root
    visible: true
    width: 1200
    height: 800
    minimumWidth: 900
    minimumHeight: 600
    title: "Aurora Player"
    color: "#0c0a0f"

    // Spotify-style Dynamic Background Blur
    Rectangle {
        id: dynamicBlur
        anchors.fill: parent
        color: "#0c0a0f"

        Rectangle {
            width: parent.width * 0.6
            height: width
            radius: width / 2
            x: -width * 0.2
            y: -height * 0.2
            color: "#4a154b"
            opacity: 0.35
        }

        Rectangle {
            width: parent.width * 0.5
            height: width
            radius: width / 2
            x: parent.width * 0.6
            y: parent.height * 0.1
            color: "#831843"
            opacity: 0.25
        }
    }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        // Left Navigation Sidebar
        Rectangle {
            Layout.fillHeight: true
            Layout.preferredWidth: 240
            color: "#0e0c14"
            opacity: 0.95

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 16
                spacing: 12

                Text {
                    text: "AURORA PRO"
                    color: "white"
                    font.bold: true
                    font.pixelSize: 18
                }

                Item { Layout.fillHeight: true }
            }
        }

        // Center Content Screen
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "transparent"

            Text {
                anchors.centerIn: parent
                text: "Aurora Player Desktop"
                color: "white"
                font.bold: true
                font.pixelSize: 24
            }
        }
    }

    // Bottom Player Bar
    Rectangle {
        id: bottomBar
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        height: 90
        color: "#120f18"
        border.color: "#22ffffff"
        border.width: 1

        RowLayout {
            anchors.fill: parent
            anchors.margins: 16

            Text {
                text: "Сейчас играет: Neon Horizon"
                color: "white"
                font.pixelSize: 13
            }

            Item { Layout.fillWidth: true }

            RoundButton {
                text: "▶"
                palette.button: "#f43f5e"
                onClicked: playerController.toggle_play()
            }

            Item { Layout.fillWidth: true }
        }
    }
}
