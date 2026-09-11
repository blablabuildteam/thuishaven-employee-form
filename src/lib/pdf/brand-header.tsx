import path from "node:path";
import React from "react";
import { Image, Text, View, StyleSheet } from "@react-pdf/renderer";

const totemPath = path.join(process.cwd(), "public/brand/totem.png");

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F2F1E6",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  totem: {
    width: 42,
    height: 42,
    objectFit: "contain",
    marginBottom: 6,
  },
  wordmark: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 8,
    marginTop: 3,
    letterSpacing: 1.2,
    color: "#5C5850",
    textTransform: "uppercase",
  },
  rule: {
    marginTop: 8,
    width: 48,
    height: 3,
    backgroundColor: "#7EB8C9",
  },
});

export function PdfBrandHeader({ subtitle }: { subtitle: string }) {
  return (
    <View style={styles.header} fixed>
      <Image src={totemPath} style={styles.totem} />
      <Text style={styles.wordmark}>THUISHAVEN</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.rule} />
    </View>
  );
}
