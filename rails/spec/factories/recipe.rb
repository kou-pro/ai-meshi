FactoryBot.define do
  factory :recipe do
    sequence(:title) {|n| "テストレシピ #{n}" }
    association :user
  end
end
