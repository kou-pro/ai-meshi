'use client'

type SimpleButtonProps = {
  text: string
}

const handleOnClick = () => {
  alert('こんにちは')
}

const SimpleButton = ({ text }: SimpleButtonProps) => {
  return <button onClick={handleOnClick}>{text}</button>
}

export default SimpleButton
