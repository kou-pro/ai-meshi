require "rails_helper"

RSpec.describe AuthExchangeCode do
  include ActiveSupport::Testing::TimeHelpers

  # single-use テストは Rails.cache を実際に使うため、テスト中だけ memory_store に差し替える
  around do |example|
    original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    example.run
  ensure
    Rails.cache = original_cache
  end

  let(:payload_args) do
    {
      access_token: "abc123",
      client: "client_xyz",
      uid: "user@example.com",
      expiry: 1_781_827_344,
    }
  end

  describe ".encode" do
    it "署名付きの文字列を返す" do
      code = described_class.encode(**payload_args)
      expect(code).to be_a(String)
      expect(code).to include("--") # MessageVerifier の '<payload>--<signature>' 形式
    end
  end

  describe ".decode" do
    it "正常なコードを payload に復号する" do
      code = described_class.encode(**payload_args)
      decoded = described_class.decode(code)

      expect(decoded[:access_token]).to eq("abc123")
      expect(decoded[:client]).to eq("client_xyz")
      expect(decoded[:uid]).to eq("user@example.com")
      expect(decoded[:expiry]).to eq(1_781_827_344)
    end

    it "改ざんされたコードは nil を返す" do
      code = described_class.encode(**payload_args)
      tampered = "#{code}TAMPERED"
      expect(described_class.decode(tampered)).to be_nil
    end

    it "期限切れのコードは nil を返す" do
      code = described_class.encode(**payload_args)

      travel_to(described_class::EXPIRES_IN.from_now + 1.second) do
        expect(described_class.decode(code)).to be_nil
      end
    end

    it "別の purpose で生成されたコードは nil を返す" do
      different = Rails.application.message_verifier(:auth_exchange).generate(
        payload_args, expires_in: 30.seconds, purpose: :wrong_purpose
      )
      expect(described_class.decode(different)).to be_nil
    end

    it "同じコードを2回 decode すると2回目は nil を返す (RFC 6749 §4.1.2 single-use 要件)" do
      code = described_class.encode(**payload_args)

      first = described_class.decode(code)
      expect(first).to be_present

      second = described_class.decode(code)
      expect(second).to be_nil
    end

    it "空文字列のコードは nil を返す" do
      expect(described_class.decode("")).to be_nil
      expect(described_class.decode(nil)).to be_nil
    end
  end
end
