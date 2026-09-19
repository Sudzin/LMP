import QtQuick
import QtQuick.Layouts

Row {
    id: visRoot
    spacing: 3
    property bool isPlaying: false
    property color barColor: "#f43f5e"

    Repeater {
        model: 4
        delegate: Rectangle {
            id: bar
            width: 3
            height: visRoot.isPlaying ? 6 + Math.random() * 12 : 4
            radius: 1.5
            color: visRoot.barColor
            anchors.bottom: parent.bottom

            SequentialAnimation on height {
                running: visRoot.isPlaying
                loops: Animation.Infinite
                NumberAnimation {
                    to: 4 + (index * 3 + 2) % 14
                    duration: 250 + (index * 70)
                    easing.type: Easing.InOutQuad
                }
                NumberAnimation {
                    to: 14 - (index * 2) % 10
                    duration: 200 + (index * 50)
                    easing.type: Easing.InOutQuad
                }
                NumberAnimation {
                    to: 5
                    duration: 180
                    easing.type: Easing.InOutQuad
                }
            }
        }
    }
}
