import QtQuick
import QtQuick.Controls

Slider {
    id: control
    hoverEnabled: true

    property color trackColor: "#221733"
    property color progressColor: "#f43f5e"
    property color progressColorEnd: "#a855f7"
    property color handleColor: "#ffffff"
    property int trackHeight: 4

    background: Rectangle {
        x: control.leftPadding
        y: control.topPadding + control.availableHeight / 2 - height / 2
        implicitWidth: 200
        implicitHeight: control.trackHeight
        width: control.availableWidth
        height: implicitHeight
        radius: height / 2
        color: control.trackColor

        Rectangle {
            width: control.visualPosition * parent.width
            height: parent.height
            radius: height / 2
            gradient: Gradient {
                orientation: Gradient.Horizontal
                GradientStop { position: 0.0; color: control.progressColor }
                GradientStop { position: 1.0; color: control.progressColorEnd }
            }
        }
    }

    handle: Rectangle {
        x: control.leftPadding + control.visualPosition * (control.availableWidth - width)
        y: control.topPadding + control.availableHeight / 2 - height / 2
        implicitWidth: control.hovered || control.pressed ? 12 : 0
        implicitHeight: control.hovered || control.pressed ? 12 : 0
        radius: width / 2
        color: control.handleColor
        border.color: control.progressColor
        border.width: 1

        Behavior on implicitWidth {
            NumberAnimation { duration: 150 }
        }
        Behavior on implicitHeight {
            NumberAnimation { duration: 150 }
        }
    }
}
