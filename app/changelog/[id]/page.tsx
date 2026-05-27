import ChangelogEditor from "../ChangelogEditor";

interface Props {
  params: { id: string };
}

export default function EditChangelogPage({ params }: Props) {
  return <ChangelogEditor id={params.id} />;
}
