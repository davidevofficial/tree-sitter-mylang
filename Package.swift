// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterMylang",
    products: [
        .library(name: "TreeSitterMylang", targets: ["TreeSitterMylang"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterMylang",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterMylangTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterMylang",
            ],
            path: "bindings/swift/TreeSitterMylangTests"
        )
    ],
    cLanguageStandard: .c11
)
