FactoryBot.define do
  factory :comment do
    sequence(:body) {|n| "テストコメント #{n}" }
    association :user
    association :recipe
  end
end
