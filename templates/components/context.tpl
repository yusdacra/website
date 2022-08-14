<div class="mb-4 overflow-auto text-sm text-gray-100">
  <context>
    <div class="pl-2 mt-2 border-l-2 border-${theme}-200 hover:border-${theme}-500">
      <context:body>
        <PandocLink class="text-gray-300">
          <Internal class="font-bold opacity-50 hover:opacity-100" />
          <External class="hover:underline" target="_blank" rel="noopener" />
        </PandocLink>
        <OrderedList class="ml-4 space-y-1 list-decimal list-inside" />
        <BulletList class="ml-4 space-y-1 list-decimal list-inside" />
        <Task:Checked>
          <apply template="/templates/components/checkbox-checked">
            <inlines />
          </apply>
        </Task:Checked>
        <Task:Unchecked>
          <apply template="/templates/components/checkbox-unchecked">
            <inlines />
          </apply>
        </Task:Unchecked>
      </context:body>
    </div>
  </context>
</div>