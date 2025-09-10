import SwiftUI

public struct Sparkline: View {
    public struct Config {
        public var strokeWidth: CGFloat = 1.8
        public var gradientFill: Bool = true
        public var showGrid: Bool = false
        public var gridOpacity: Double = 0.08
        public init() {}
    }
    
    public let data: [Double]
    public var color: Color
    public var config: Config
    
    public init(data: [Double], color: Color, config: Config = .init()) {
        self.data = data
        self.color = color
        self.config = config
    }
    
    public var body: some View {
        GeometryReader { geo in
            ZStack {
                if config.showGrid {
                    GridBackground(rows: 3, cols: 6)
                        .stroke(lineWidth: 1)
                        .foregroundStyle(Color.white.opacity(config.gridOpacity))
                }
                let normalized = normalize(data)
                let path = pathFor(normalized, in: geo.size)
                if config.gradientFill {
                    path
                        .strokedPath(.init(lineWidth: config.strokeWidth, lineCap: .round, lineJoin: .round))
                        .foregroundStyle(color)
                        .overlay(
                            path
                                .fill(LinearGradient(colors: [color.opacity(0.25), .clear], startPoint: .top, endPoint: .bottom))
                        )
                } else {
                    path
                        .strokedPath(.init(lineWidth: config.strokeWidth, lineCap: .round, lineJoin: .round))
                        .foregroundStyle(color)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func normalize(_ values: [Double]) -> [Double] {
        guard let min = values.min(), let max = values.max(), max > min else { return Array(repeating: 0.5, count: values.count) }
        let range = max - min
        return values.map { ($0 - min) / range }
    }
    
    private func pathFor(_ values: [Double], in size: CGSize) -> Path {
        guard values.count > 1 else { return Path() }
        let stepX = size.width / CGFloat(values.count - 1)
        let points = values.enumerated().map { idx, v in CGPoint(x: CGFloat(idx) * stepX, y: size.height - CGFloat(v) * size.height) }
        return smoothPath(points)
    }
    
    private func smoothPath(_ pts: [CGPoint]) -> Path {
        var path = Path()
        guard pts.count > 1 else { return path }
        path.move(to: pts[0])
        for i in 1..<pts.count {
            let prev = pts[i-1]
            let curr = pts[i]
            let mid = CGPoint(x: (prev.x + curr.x)/2, y: (prev.y + curr.y)/2)
            path.addQuadCurve(to: mid, control: CGPoint(x: mid.x, y: prev.y))
            path.addQuadCurve(to: curr, control: CGPoint(x: mid.x, y: curr.y))
        }
        // Close for fill use
        path.addLine(to: CGPoint(x: pts.last!.x, y: pts.last!.y + 1000))
        path.addLine(to: CGPoint(x: pts.first!.x, y: pts.first!.y + 1000))
        path.closeSubpath()
        // Recreate stroke-only path overlay by re-tracing (stroke done on filled path above)
        var stroke = Path()
        stroke.move(to: pts[0])
        for i in 1..<pts.count {
            let prev = pts[i-1]
            let curr = pts[i]
            let mid = CGPoint(x: (prev.x + curr.x)/2, y: (prev.y + curr.y)/2)
            stroke.addQuadCurve(to: mid, control: CGPoint(x: mid.x, y: prev.y))
            stroke.addQuadCurve(to: curr, control: CGPoint(x: mid.x, y: curr.y))
        }
        return stroke
    }
}

struct GridBackground: Shape {
    let rows: Int
    let cols: Int
    func path(in rect: CGRect) -> Path {
        var p = Path()
        guard rows > 0 && cols > 0 else { return p }
        let dy = rect.height / CGFloat(rows)
        let dx = rect.width / CGFloat(cols)
        for r in 0...rows { p.move(to: CGPoint(x: 0, y: CGFloat(r) * dy)); p.addLine(to: CGPoint(x: rect.width, y: CGFloat(r) * dy)) }
        for c in 0...cols { p.move(to: CGPoint(x: CGFloat(c) * dx, y: 0)); p.addLine(to: CGPoint(x: CGFloat(c) * dx, y: rect.height)) }
        return p
    }
}

