FactoryBot.define do
  factory :shopping_list_item do
    sequence(:ingredient_name) {|n| "食材 #{n}" }
    association :user
    association :recipe
  end
end
