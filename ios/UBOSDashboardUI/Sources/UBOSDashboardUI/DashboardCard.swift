import SwiftUI

public struct DashboardCard: View {
    let title: String
    let value: String
    let subtitle: String?
    let color: Color
    let data: [Double]
    let palette: UBOSPalette
    @Environment(\.depthLevel) var depth
    
    public init(title: String, value: String, subtitle: String? = nil, color: Color, data: [Double], palette: UBOSPalette = .init()) {
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.color = color
        self.data = data
        self.palette = palette
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(palette.neutral300)
            Text(value)
                .font(.system(size: 28, weight: .semibold, design: .rounded))
                .foregroundStyle(.white)
            if let subtitle { Text(subtitle).font(.footnote).foregroundStyle(palette.neutral500) }
            Sparkline(
                data: data,
                color: color,
                config: .init(
                    strokeWidth: depth == .minimal ? 1.5 : (depth == .standard ? 1.8 : 2.0),
                    gradientFill: depth != .minimal,
                    showGrid: depth != .minimal,
                    gridOpacity: depth == .expanded ? 0.1 : 0.08
                )
            )
            .frame(height: 56)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(palette.bgSecondary)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(palette.gridline, lineWidth: 1)
                )
        )
    }
}

