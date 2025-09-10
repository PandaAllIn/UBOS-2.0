import SwiftUI

public enum DepthLevel: Int, CaseIterable, Identifiable {
    case minimal = 0
    case standard = 1
    case expanded = 2
    
    public var id: Int { rawValue }
    public var title: String {
        switch self {
        case .minimal: return "Minimal"
        case .standard: return "Standard"
        case .expanded: return "Expanded"
        }
    }
}

private struct DepthLevelKey: EnvironmentKey {
    static let defaultValue: DepthLevel = .standard
}

public extension EnvironmentValues {
    var depthLevel: DepthLevel {
        get { self[DepthLevelKey.self] }
        set { self[DepthLevelKey.self] = newValue }
    }
}

public extension View {
    func depthLevel(_ level: DepthLevel) -> some View {
        environment(\._depthLevel, level)
    }
}

// Internal workaround: expose EnvironmentValues key path
private extension EnvironmentValues {
    var _depthLevel: DepthLevel {
        get { self[DepthLevelKey.self] }
        set { self[DepthLevelKey.self] = newValue }
    }
}

