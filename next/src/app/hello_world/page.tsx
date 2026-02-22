import SimpleButton from '@/components/SimpleButton'

export default function HelloWorld() {
  const count = 100

  return (
    <>
      <div>Hello World!</div>
      <p>{count}</p>
      <SimpleButton text="こんちは" />
    </>
  )
}
