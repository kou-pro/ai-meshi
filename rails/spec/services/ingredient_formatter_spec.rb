require "rails_helper"

RSpec.describe IngredientFormatter do
  describe ".call" do
    # ヘルパー: 同じ呼び出しパターンを各テストで使い回す。
    # 名前は `format` を避ける (Kernel#format と衝突して RuboCop が
    # `Style/FormatString` で `%` オペレータに自動変換してしまうため)。
    def call_formatter(quantity, unit)
      described_class.call(quantity: quantity, unit: unit)
    end

    context "通常の数値 + 単位 (後置)" do
      it "100 + g → '100g'" do
        expect(call_formatter("100", "g")).to eq("100g")
      end

      it "2 + 本 → '2本'" do
        expect(call_formatter("2", "本")).to eq("2本")
      end

      it "200 + ml → '200ml'" do
        expect(call_formatter("200", "ml")).to eq("200ml")
      end

      it "5 + 枚 → '5枚'" do
        expect(call_formatter("5", "枚")).to eq("5枚")
      end
    end

    context "数値 + 大さじ/小さじ/カップ (前置)" do
      it "1 + 大さじ → '大さじ1' (順序逆転)" do
        expect(call_formatter("1", "大さじ")).to eq("大さじ1")
      end

      it "1 + 小さじ → '小さじ1'" do
        expect(call_formatter("1", "小さじ")).to eq("小さじ1")
      end

      it "2 + カップ → 'カップ2'" do
        expect(call_formatter("2", "カップ")).to eq("カップ2")
      end

      it "1/2 + 大さじ のような分数表記でも前置される" do
        expect(call_formatter("1/2", "大さじ")).to eq("大さじ1/2")
      end
    end

    context "数量だけのキーワード (単位を伴わない)" do
      # 業界標準の amount-only キーワードを全て確認する
      it "適量 + 任意の単位 → '適量' (単位は捨てる)" do
        expect(call_formatter("適量", "g")).to eq("適量")
        expect(call_formatter("適量", "枚")).to eq("適量")
        expect(call_formatter("適量", "")).to eq("適量")
      end

      it "適宜 + 任意の単位 → '適宜'" do
        expect(call_formatter("適宜", "g")).to eq("適宜")
      end

      it "少々 + 任意の単位 → '少々'" do
        expect(call_formatter("少々", "g")).to eq("少々")
      end

      it "ひとつまみ + 任意の単位 → 'ひとつまみ'" do
        expect(call_formatter("ひとつまみ", "g")).to eq("ひとつまみ")
      end

      it "ふたつまみ + 任意の単位 → 'ふたつまみ'" do
        expect(call_formatter("ふたつまみ", "g")).to eq("ふたつまみ")
      end

      it "ひとにぎり + 任意の単位 → 'ひとにぎり'" do
        expect(call_formatter("ひとにぎり", "g")).to eq("ひとにぎり")
      end

      it "一握り + 任意の単位 → '一握り'" do
        expect(call_formatter("一握り", "g")).to eq("一握り")
      end

      it "ひとつかみ + 任意の単位 → 'ひとつかみ'" do
        expect(call_formatter("ひとつかみ", "g")).to eq("ひとつかみ")
      end

      it "お好み + 任意の単位 → 'お好み'" do
        expect(call_formatter("お好み", "g")).to eq("お好み")
      end

      it "お好みで + 任意の単位 → 'お好みで'" do
        expect(call_formatter("お好みで", "g")).to eq("お好みで")
      end

      it "お好みの量 + 任意の単位 → 'お好みの量'" do
        expect(call_formatter("お好みの量", "g")).to eq("お好みの量")
      end

      it "お好きな量 + 任意の単位 → 'お好きな量'" do
        expect(call_formatter("お好きな量", "g")).to eq("お好きな量")
      end

      it "各適量 + 任意の単位 → '各適量'" do
        expect(call_formatter("各適量", "g")).to eq("各適量")
      end

      it "半分 + 任意の単位 → '半分'" do
        expect(call_formatter("半分", "本")).to eq("半分")
      end
    end

    context "空値・nil" do
      it "両方空 → ''" do
        expect(call_formatter("", "")).to eq("")
      end

      it "両方 nil → ''" do
        expect(call_formatter(nil, nil)).to eq("")
      end

      it "quantity だけ空 → unit のみ" do
        expect(call_formatter("", "枚")).to eq("枚")
        expect(call_formatter(nil, "枚")).to eq("枚")
      end

      it "unit だけ空 → quantity のみ" do
        expect(call_formatter("5", "")).to eq("5")
        expect(call_formatter("5", nil)).to eq("5")
      end
    end

    context "前後空白" do
      it "trim される" do
        expect(call_formatter("  100  ", "  g  ")).to eq("100g")
      end

      it "前後空白だけは空扱い" do
        expect(call_formatter("   ", "   ")).to eq("")
      end
    end

    context "範囲・分数表記" do
      it "1〜2 + 本 → '1〜2本' (波ダッシュ)" do
        expect(call_formatter("1〜2", "本")).to eq("1〜2本")
      end

      it "1.5 + 個 → '1.5個' (小数)" do
        expect(call_formatter("1.5", "個")).to eq("1.5個")
      end

      it "1/3 + カップ → 'カップ1/3' (前置 + 分数)" do
        expect(call_formatter("1/3", "カップ")).to eq("カップ1/3")
      end
    end

    context "回帰テスト (実際に発生したバグ)" do
      it "白ごま: 適量 + g → '適量' (旧バグ: '適量g')" do
        expect(call_formatter("適量", "g")).to eq("適量")
      end

      it "醤油: 1 + 大さじ → '大さじ1' (旧バグ: '1大さじ')" do
        expect(call_formatter("1", "大さじ")).to eq("大さじ1")
      end

      it "砂糖: 1 + 小さじ → '小さじ1' (旧バグ: '1小さじ')" do
        expect(call_formatter("1", "小さじ")).to eq("小さじ1")
      end
    end
  end

  describe "定数の不変性" do
    it "AMOUNT_ONLY_KEYWORDS は frozen である" do
      expect(IngredientFormatter::AMOUNT_ONLY_KEYWORDS).to be_frozen
    end

    it "UNIT_FIRST は frozen である" do
      expect(IngredientFormatter::UNIT_FIRST).to be_frozen
    end
  end
end
