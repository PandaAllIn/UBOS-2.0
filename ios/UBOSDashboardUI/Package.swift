// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "UBOSDashboardUI",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(name: "UBOSDashboardUI", targets: ["UBOSDashboardUI"])    
    ],
    targets: [
        .target(name: "UBOSDashboardUI", path: "Sources/UBOSDashboardUI")
    ]
)

