import SwiftUI

public struct UBOSPalette {
    public let bgPrimary = Color(hex: "#0B1220")
    public let bgSecondary = Color(hex: "#121A2B")
    public let accentPrimary = Color(hex: "#49C0C7")
    public let accentSecondary = Color(hex: "#2DA1A8")
    public let neutral100 = Color(hex: "#F5F7FA")
    public let neutral300 = Color(hex: "#C9D3E0")
    public let neutral500 = Color(hex: "#8CA0B3")
    public let neutral700 = Color(hex: "#5E6C82")
    public let ok = Color(hex: "#43D17C")
    public let warn = Color(hex: "#F4A261")
    public let danger = Color(hex: "#E76F51")
    public let gridline = Color.white.opacity(0.08)
}

public extension Color {
    init(hex: String) {
        let cleaned = hex.replacingOccurrences(of: "#", with: "")
        var int: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch cleaned.count {
        case 8: (a, r, g, b) = ((int >> 24) & 0xff, (int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff)
        case 6: (a, r, g, b) = (255, (int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}

