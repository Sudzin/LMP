import QtQuick

Item {
    id: bgRoot
    anchors.fill: parent

    property color primaryGlow: "#831843"   // rose / crimson
    property color secondaryGlow: "#3b0764" // deep purple / amethyst
    property color tertiaryGlow: "#431407"  // warm ember

    // Пятно 1 (Верхний левый угол)
    Rectangle {
        id: blob1
        x: -parent.width * 0.15
        y: -parent.height * 0.2
        width: parent.width * 0.65
        height: parent.width * 0.65
        radius: width / 2
        opacity: 0.28
        gradient: Gradient {
            GradientStop { position: 0.0; color: bgRoot.primaryGlow }
            GradientStop { position: 0.7; color: "transparent" }
        }

        SequentialAnimation on x {
            loops: Animation.Infinite
            NumberAnimation { to: -bgRoot.width * 0.08; duration: 9000; easing.type: Easing.InOutQuad }
            NumberAnimation { to: -bgRoot.width * 0.15; duration: 9000; easing.type: Easing.InOutQuad }
        }
        SequentialAnimation on y {
            loops: Animation.Infinite
            NumberAnimation { to: -bgRoot.height * 0.12; duration: 11000; easing.type: Easing.InOutQuad }
            NumberAnimation { to: -bgRoot.height * 0.2; duration: 11000; easing.type: Easing.InOutQuad }
        }
    }

    // Пятно 2 (Верхний правый угол)
    Rectangle {
        id: blob2
        x: parent.width * 0.65
        y: -parent.height * 0.15
        width: parent.width * 0.55
        height: parent.width * 0.55
        radius: width / 2
        opacity: 0.22
        gradient: Gradient {
            GradientStop { position: 0.0; color: bgRoot.secondaryGlow }
            GradientStop { position: 0.75; color: "transparent" }
        }

        SequentialAnimation on x {
            loops: Animation.Infinite
            NumberAnimation { to: bgRoot.width * 0.58; duration: 12000; easing.type: Easing.InOutQuad }
            NumberAnimation { to: bgRoot.width * 0.65; duration: 12000; easing.type: Easing.InOutQuad }
        }
    }

    // Пятно 3 (Нижний центр)
    Rectangle {
        id: blob3
        x: parent.width * 0.25
        y: parent.height * 0.55
        width: parent.width * 0.5
        height: parent.width * 0.5
        radius: width / 2
        opacity: 0.18
        gradient: Gradient {
            GradientStop { position: 0.0; color: bgRoot.tertiaryGlow }
            GradientStop { position: 0.7; color: "transparent" }
        }
    }

    // Тонкий градиентный виньеточный оверлей для глубокого черного контраста
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            orientation: Gradient.Vertical
            GradientStop { position: 0.0; color: "#00000000" }
            GradientStop { position: 0.7; color: "#800c0a0f" }
            GradientStop { position: 1.0; color: "#ee0c0a0f" }
        }
    }
}
