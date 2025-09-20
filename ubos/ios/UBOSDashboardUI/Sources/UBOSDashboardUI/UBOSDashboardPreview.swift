import SwiftUI

public struct UBOSDashboardPreview: View {
    let palette = UBOSPalette()
    @State private var depth: DepthLevel = .standard
    @State private var range: Int = 1
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Picker("Depth", selection: $depth) {
                        ForEach(DepthLevel.allCases) { d in Text(d.title).tag(d) }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    
                    HStack(spacing: 12) {
                        DashboardCard(
                            title: "Citizen Activity",
                            value: "12,540",
                            subtitle: "+8.2% today",
                            color: palette.accentPrimary,
                            data: demoSeries(multiplier: 1.0)
                        )
                        DashboardCard(
                            title: "Agent Performance",
                            value: "96.3%",
                            subtitle: "SLO ✓",
                            color: palette.accentSecondary,
                            data: demoSeries(multiplier: 0.9)
                        )
                    }
                    .padding(.horizontal)
                    
                    HStack(spacing: 12) {
                        DashboardCard(
                            title: "Territory Health",
                            value: "0.78",
                            subtitle: "Attention band",
                            color: palette.ok,
                            data: demoSeries(multiplier: 0.7)
                        )
                        DashboardCard(
                            title: "Governance",
                            value: "83%",
                            subtitle: "Adoption ↑",
                            color: palette.neutral500,
                            data: demoSeries(multiplier: 0.8)
                        )
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(
                LinearGradient(colors: [palette.bgPrimary, palette.bgSecondary], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
            )
            .environment(\._depthLevel, depth)
            .navigationTitle("UBOS Dashboard")
            .toolbar { ToolbarItem(placement: .principal) { Text("UBOS Dashboard").font(.headline).foregroundStyle(.white) } }
        }
        .preferredColorScheme(.dark)
    }
    
    private func demoSeries(multiplier: Double) -> [Double] {
        let base: [Double] = [0.1,0.15,0.2,0.18,0.26,0.33,0.41,0.48,0.42,0.36,0.32,0.29,0.35,0.44,0.52,0.47,0.39,0.31,0.28,0.22,0.2,0.26,0.3,0.38]
        return base.map { $0 * (0.6 + 0.8 * multiplier) }
    }
}

#if DEBUG
struct UBOSDashboardPreview_Previews: PreviewProvider {
    static var previews: some View {
        UBOSDashboardPreview()
    }
}
#endif

