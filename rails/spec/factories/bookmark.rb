FactoryBot.define do
  factory :bookmark do
    association :user
    association :recipe
  end
end
